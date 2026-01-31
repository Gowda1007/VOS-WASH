import React, { useMemo, useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, RefreshControl, TouchableOpacity, ScrollView } from 'react-native';
import { InvoiceCard, EmptyState, Button, Modal, Input, InvoicePreviewScreen, PaymentModal } from '../components';
import { useNavigation } from '@react-navigation/native';
import { useInvoices } from '../hooks/useInvoices';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { useAppSettings } from '../hooks/useAppSettings';
// Preview is unified via InvoicePreviewStep in dedicated screens/modals
import { colors, spacing, typography } from '../styles/theme';
import { calculateStatus, formatInvoiceDate, formatDateInput } from '../core/utils/invoiceUtils';
import type { Invoice, InvoiceStatus } from '../core/types';
import { getPdfAdapter, getNotificationAdapter, getQrAdapter, apiService } from '../services';
import QRCode from 'react-native-qrcode-svg';
import { calculateInvoiceTotal, calculateTotalPaid, calculateRemainingBalance, formatCurrency, formatCurrencyShortIndian } from '../core/utils/invoiceUtils';
import { MaterialIcons } from '@expo/vector-icons';

type FilterStatus = 'all' | 'outstanding' | InvoiceStatus;

export const InvoicesScreen: React.FC = () => {
	const { t, language } = useLanguage();
	const { settings: appSettings } = useAppSettings();
	const { invoices, loading, deleteInvoice, fetchInvoices, updateInvoice, recordPayment } = useInvoices();
	const toast = useToast();
	const [search, setSearch] = useState('');
	const [filter, setFilter] = useState<FilterStatus>('all');
	const [collectVisible, setCollectVisible] = useState(false);
	const [editVisible, setEditVisible] = useState(false);
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
	const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
	const startDateRef = useRef<string>('');
	const endDateRef = useRef<string>('');

	useEffect(() => {
		fetchInvoices({
			q: search || undefined,
			status: filter,
			from: startDateRef.current || undefined,
			to: endDateRef.current || undefined,
		});
	}, [search, filter]);

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		return invoices
			.filter((inv: Invoice) => {
				const status = calculateStatus(inv);
				const matchesQuery = !q
					|| inv.customerName.toLowerCase().includes(q)
					|| inv.customerPhone.includes(q)
					|| inv.invoiceNumber.toLowerCase().includes(q);
				const matchesFilter = filter === 'all'
					|| (filter === 'outstanding' && (status === 'unpaid' || status === 'partially_paid'))
					|| status === filter;

				const dateStr = inv.invoiceDate.includes('/') ? inv.invoiceDate.replaceAll('/', '-') : inv.invoiceDate;
				const [d, m, y] = dateStr.split('-');
				const invDate = new Date(Number(y), Number(m) - 1, Number(d));
				let withinRange = true;
				if (startDateRef.current) {
					const s = new Date(startDateRef.current);
					s.setHours(0,0,0,0);
					withinRange = invDate >= s;
				}
				if (withinRange && endDateRef.current) {
					const e = new Date(endDateRef.current);
					e.setHours(23,59,59,999);
					withinRange = invDate <= e;
				}
				return matchesQuery && matchesFilter && withinRange;
			})
			.sort((a, b) => b.invoiceNumber.localeCompare(a.invoiceNumber));
	}, [invoices, search, filter]);

	// Aggregated revenue for filtered invoices (includes GST via calculateInvoiceTotal)
	const filteredRevenueTotal = useMemo(() => {
		return filtered.reduce((sum, inv) => sum + calculateInvoiceTotal(inv.services), 0);
	}, [filtered]);

	const navigation = useNavigation<any>();
	const openPreview = (inv: Invoice) => setPreviewInvoice(inv);
	const openCollect = (inv: Invoice) => { 
		setActiveInvoice(inv); 
		setCollectVisible(true); 
	};
	const openEdit = (inv: Invoice) => { 
		setActiveInvoice(inv); 
		setEditVisible(true); 
	};

	return (
		<>
		<View style={styles.container}>
			<Text style={styles.title}>{t('page-title-invoices')}</Text>

			{/* Search Bar */}
			<TextInput
				value={search}
				onChangeText={setSearch}
				placeholder={t('search-invoices-placeholder', 'Search invoices...')}
				placeholderTextColor={colors.textLight}
				style={styles.search}
			/>

			{/* Filter Chips */}
			<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
				{(['all','outstanding','paid','unpaid','partially_paid'] as FilterStatus[]).map((key) => {
					const isActive = filter === key;
					const activeColor = (() => {
						switch (key) {
							case 'paid': return colors.success;
							case 'unpaid': return colors.error;
							case 'partially_paid': return colors.warning;
							case 'outstanding': return colors.warning;
							default: return colors.primary;
						}
					})();
					return (
						<TouchableOpacity
							key={key}
							onPress={() => setFilter(key)}
							style={[
								styles.filterChip,
								{ backgroundColor: isActive ? activeColor : colors.white, borderColor: isActive ? activeColor : colors.border }
							]}
						>
							<Text style={[styles.filterText, isActive && styles.filterTextActive]}>
								{t(key)}
							</Text>
						</TouchableOpacity>
					);
				})}
			</ScrollView>

			{/* Actions Row */}
			<View style={styles.actionsRow}>
				<TouchableOpacity
					style={styles.actionButton}
					onPress={async () => {
						try {
							const cols = [
								t('invoice-number', 'Invoice #'),
								t('date', 'Date'),
								t('customer', 'Customer'),
								t('status', 'Status'),
								t('total-amount', 'Total'),
								t('balance-due-label', 'Balance'),
							];
							const rows = filtered.map(inv => {
								const total = calculateInvoiceTotal(inv.services);
								const paid = calculateTotalPaid(inv);
								const stat = calculateStatus(inv);
								const balanceDue = calculateRemainingBalance(inv);
								return [
									`#${inv.invoiceNumber}`,
									inv.invoiceDate,
									inv.customerName,
									t(stat),
									`${formatCurrency(total)}`,
									`${formatCurrency(balanceDue)}`,
								];
						});
							const title = t('invoice-list-report-title', 'Invoice List Report');
							const pdfAdapter = getPdfAdapter();
							const notificationAdapter = getNotificationAdapter();
							const res = await (pdfAdapter as any).generateSimpleListPdf?.({ title, columns: cols, rows, fileName: 'Invoice_List.pdf' });
							if (res?.success && res.filePath) {
								await (pdfAdapter as any).openPdf?.(res.filePath);
								notificationAdapter.showNotification?.({ title: t('export-pdf', 'Export PDF'), body: t('export-pdf-success-message', 'Data exported to PDF.') });
								toast.success(t('export-success', 'Exported successfully'));
							}
						} catch (e) {
							console.error('Export PDF failed', e);
							toast.error(t('export-failed', 'Export failed'));
						}
					}}
				>
					<MaterialIcons name="picture-as-pdf" size={18} color={colors.primary} />
					<Text style={styles.actionButtonText}>{t('export', 'Export')}</Text>
				</TouchableOpacity>
			</View>

			{/* Summary Stats */}
			<View style={styles.statsRow}>
				<View style={styles.statBox}>
					<Text style={styles.statLabel}>{t('total-invoices', 'Total')}</Text>
					<Text style={styles.statValue}>{filtered.length}</Text>
				</View>
				<View style={styles.statBox}>
					<Text style={styles.statLabel}>{t('filtered-revenue', 'Revenue')}</Text>
					<Text style={styles.statValue}>{formatCurrencyShortIndian(filteredRevenueTotal, language)}</Text>
				</View>
			</View>
			{filtered.length === 0 ? (
				<EmptyState icon="receipt" title={t('no-invoices-found', 'No invoices found')} message={t('adjust-filters-message', 'Adjust filters or create a new invoice.')} />
			) : (
				<FlatList
					data={filtered}
					keyExtractor={(item) => item.invoiceNumber}
					renderItem={({ item }) => (
						<InvoiceCard
							invoice={item}
							onPreview={openPreview}
							onCollect={openCollect}
							onDelete={(num) => {
								setActiveInvoice(item);
								setConfirmDelete(true);
							}}
							onEdit={openEdit}
						/>
					)}
					contentContainerStyle={{ paddingBottom: spacing.lg }}
					refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchInvoices} />}
				/>
			)}
		</View>

		{/* Confirm Delete Modal */}
		<Modal visible={!!confirmDelete} onClose={() => setConfirmDelete(false)} title={t('confirm-delete-title','Delete Invoice?')}>
			<Text style={{ marginBottom: spacing.md }}>{t('confirm-delete-message','This action cannot be undone.')}</Text>
			<View style={{ flexDirection:'row', gap: spacing.md }}>
				<Button variant="secondary" onPress={() => setConfirmDelete(false)}>{t('cancel','Cancel')}</Button>
				<Button variant="danger" onPress={async () => { 
			if (activeInvoice) { 
				try {
					await deleteInvoice(activeInvoice.invoiceNumber);
					toast.success(t('invoice-deleted-success', 'Invoice deleted successfully!'));
				} catch (e) {
					toast.error(t('error-deleting-invoice', 'Error deleting invoice'));
				}
				setConfirmDelete(false); 
				setActiveInvoice(null); 
			} 
		}}>{t('delete','Delete')}</Button>
			</View>
		</Modal>

		{/* Edit Invoice Modal: Enhanced with service add/remove and payment editing */}
		<Modal visible={editVisible} onClose={() => setEditVisible(false)} title={t('edit-invoice','Edit Invoice')}>
			{activeInvoice && (
				<View>
					<Input label={t('customer-name','Customer Name')} value={activeInvoice.customerName} onChangeText={(v)=> setActiveInvoice({ ...activeInvoice, customerName: v })} />
					<Input label={t('customer-phone','Customer Phone')} value={activeInvoice.customerPhone} onChangeText={(v)=> setActiveInvoice({ ...activeInvoice, customerPhone: v })} keyboardType="phone-pad" />
					<Input label={t('customer-address','Customer Address')} value={activeInvoice.customerAddress} onChangeText={(v)=> setActiveInvoice({ ...activeInvoice, customerAddress: v })} />
					
					<View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginTop: spacing.md, marginBottom: spacing.xs }}>
						<Text style={{ ...typography.body, color: colors.text, fontWeight:'600' }}>{t('services','Services')}</Text>
						<TouchableOpacity 
							onPress={()=> {
								const newSvc = { name: 'New Service', quantity: 1, price: 0 };
								setActiveInvoice({ ...activeInvoice, services: [...activeInvoice.services, newSvc] });
							}}
							style={{ flexDirection:'row', alignItems:'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 4, backgroundColor: colors.primary, borderRadius: 6 }}
						>
							<MaterialIcons name="add" size={16} color={colors.white} />
							<Text style={{ ...typography.caption, color: colors.white, fontWeight:'600' }}>{t('add-row','Add')}</Text>
						</TouchableOpacity>
					</View>
					<ScrollView style={{ maxHeight: 240 }}>
						{activeInvoice.services.map((svc, idx) => (
							<View key={idx} style={{ flexDirection:'row', alignItems:'center', gap: spacing.xs, marginBottom: spacing.xs }}>
								<Input style={{ flex:2 }} value={svc.name} onChangeText={(v)=> {
									const svcs=[...activeInvoice.services]; svcs[idx] = { ...svcs[idx], name: v }; setActiveInvoice({ ...activeInvoice, services: svcs });
								}} />
								<Input style={{ flex:1 }} value={String(svc.quantity)} onChangeText={(v)=> {
									const svcs=[...activeInvoice.services]; svcs[idx] = { ...svcs[idx], quantity: Number(v)||0 }; setActiveInvoice({ ...activeInvoice, services: svcs });
								}} keyboardType="numeric" />
								<Input style={{ flex:1 }} value={String(svc.price)} onChangeText={(v)=> {
									const svcs=[...activeInvoice.services]; svcs[idx] = { ...svcs[idx], price: Number(v)||0 }; setActiveInvoice({ ...activeInvoice, services: svcs });
								}} keyboardType="numeric" />
								<TouchableOpacity 
									onPress={()=> {
										const svcs = activeInvoice.services.filter((_, i) => i !== idx);
										setActiveInvoice({ ...activeInvoice, services: svcs });
									}}
									style={{ padding: spacing.xs }}
								>
									<MaterialIcons name="delete" size={20} color={colors.error} />
								</TouchableOpacity>
							</View>
						))}
					</ScrollView>

					{/* Payments Section */}
					<View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginTop: spacing.md, marginBottom: spacing.xs }}>
						<Text style={{ ...typography.body, color: colors.text, fontWeight:'600' }}>{t('payments','Payments')}</Text>
						<TouchableOpacity 
							onPress={()=> {
								const newPayment = { amount: 0, date: formatInvoiceDate(new Date().toISOString().slice(0,10)), method: 'cash' as const };
								setActiveInvoice({ ...activeInvoice, payments: [...(activeInvoice.payments || []), newPayment] });
							}}
							style={{ flexDirection:'row', alignItems:'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 4, backgroundColor: colors.success, borderRadius: 6 }}
						>
							<MaterialIcons name="add" size={16} color={colors.white} />
							<Text style={{ ...typography.caption, color: colors.white, fontWeight:'600' }}>{t('add-payment','Add')}</Text>
						</TouchableOpacity>
					</View>
					{(activeInvoice.payments || []).length === 0 ? (
						<Text style={{ ...typography.caption, color: colors.textSecondary, fontStyle:'italic' }}>{t('no-payments-recorded','No payments recorded yet.')}</Text>
					) : (
						<ScrollView style={{ maxHeight: 160 }}>
							{(activeInvoice.payments || []).map((pmt, idx) => (
								<View key={idx} style={{ flexDirection:'row', alignItems:'center', gap: spacing.xs, marginBottom: spacing.xs }}>
									<Input style={{ flex:1 }} value={String(pmt.amount)} onChangeText={(v)=> {
										const pmts=[...(activeInvoice.payments || [])]; pmts[idx] = { ...pmts[idx], amount: Number(v)||0 }; setActiveInvoice({ ...activeInvoice, payments: pmts });
									}} keyboardType="numeric" />
									<Input 
										style={{ flex:1 }} 
										value={pmt.date} 
										onChangeText={(v)=> {
											const pmts=[...(activeInvoice.payments || [])]; pmts[idx] = { ...pmts[idx], date: formatDateInput(v) }; setActiveInvoice({ ...activeInvoice, payments: pmts });
										}}
										keyboardType="numeric"
										placeholder="DD/MM/YYYY"
									/>
									<TouchableOpacity 
										onPress={()=> {
											const pmts = (activeInvoice.payments || []).filter((_, i) => i !== idx);
											setActiveInvoice({ ...activeInvoice, payments: pmts });
										}}
										style={{ padding: spacing.xs }}
									>
										<MaterialIcons name="delete" size={20} color={colors.error} />
									</TouchableOpacity>
								</View>
							))}
						</ScrollView>
					)}

					<View style={{ flexDirection:'row', gap: spacing.md, marginTop: spacing.md }}>
						<Button variant="secondary" onPress={()=> setEditVisible(false)}>{t('close','Close')}</Button>
						<Button onPress={async ()=> { if (activeInvoice) { await updateInvoice(activeInvoice.invoiceNumber, { ...activeInvoice }); setEditVisible(false); } }}>{t('save','Save')}</Button>
					</View>
				</View>
			)}
		</Modal>

		{/* Invoice Preview Modal */}
		{previewInvoice && (
			<Modal visible={true} onClose={() => setPreviewInvoice(null)} title="">
				<InvoicePreviewScreen
					invoice={previewInvoice}
					company={{
						name: appSettings.companyName,
						tagline: appSettings.companyTagline || '',
						address: 'Uttarahalli, Bengaluru - 61',
						phone: appSettings.companyPhone,
						email: appSettings.companyEmail,
						gstNumber: appSettings.gstNumber || '',
					}}
					onClose={() => setPreviewInvoice(null)}
					onCollectPayment={() => {
						const invoiceToCollect = previewInvoice;
						setPreviewInvoice(null);
						setActiveInvoice(invoiceToCollect);
						setCollectVisible(true);
					}}
				/>
			</Modal>
		)}

		{/* Payment Collection Modal */}
		<PaymentModal
			visible={collectVisible}
			invoice={activeInvoice}
			onClose={() => {
				setCollectVisible(false);
				setActiveInvoice(null);
			}}
			onSuccess={() => {
				setCollectVisible(false);
				setActiveInvoice(null);
				fetchInvoices();
			}}
		/>
	</>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
	title: { ...typography.h3, color: colors.text, marginBottom: spacing.md, fontWeight: '600' },
	search: {
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: 8,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		color: colors.text,
		marginBottom: spacing.md,
		backgroundColor: colors.white,
		fontSize: 14,
		height: 40,
	},
	filterRow: {
		flexDirection: 'row',
		marginBottom: spacing.md,
		gap: spacing.sm,
	},
	filterChip: {
		paddingHorizontal: spacing.md,
		height: 40,
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 8,
		backgroundColor: colors.white,
		borderWidth: 1,
		borderColor: colors.border,
		marginRight: spacing.xs,
	},
	filterText: {
		...typography.caption,
		color: colors.text,
		fontWeight: '600',
		textTransform: 'capitalize',
	},
	filterTextActive: {
		color: colors.white,
		fontWeight: '600',
	},
	actionsRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-end',
		marginBottom: spacing.md,
	},
	actionButton: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.xs,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: 8,
		backgroundColor: colors.white,
	},
	actionButtonText: {
		...typography.bodySmall,
		color: colors.primary,
		fontWeight: '600',
	},
	statsRow: {
		flexDirection: 'row',
		gap: spacing.sm,
		marginBottom: spacing.md,
	},
	statBox: {
		flex: 1,
		backgroundColor: colors.white,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: 8,
		padding: spacing.sm,
	},
	statLabel: {
		...typography.caption,
		color: colors.textSecondary,
		marginBottom: 4,
	},
	statValue: {
		...typography.h4,
		color: colors.text,
		fontWeight: '600',
	},
	summary: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm },
});
