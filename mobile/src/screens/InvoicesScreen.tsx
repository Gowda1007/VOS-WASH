import React, { useMemo, useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, RefreshControl, TouchableOpacity, ScrollView } from 'react-native';
import { InvoiceCard, EmptyState, Button, Modal, Input } from '../components';
import { InvoicePreviewModal } from '../components/InvoicePreviewModal';
import { PaymentModal } from '../components/PaymentModal';
import { useInvoices } from '../hooks/useInvoices';
import { useLanguage } from '../context/LanguageContext';
import { colors, spacing, typography } from '../styles/theme';
import { calculateStatus } from '../core/utils/invoiceUtils';
import type { Invoice, InvoiceStatus } from '../core/types';
import { pdfAdapter, notificationAdapter, qrAdapter, apiService } from '../services';
import QRCode from 'react-native-qrcode-svg';
import { calculateInvoiceTotal, calculateTotalPaid, calculateRemainingBalance } from '../core/utils/invoiceUtils';

type FilterStatus = 'all' | 'outstanding' | InvoiceStatus;

export const InvoicesScreen: React.FC = () => {
	const { t } = useLanguage();
	const { invoices, loading, deleteInvoice, fetchInvoices } = useInvoices();
	const [search, setSearch] = useState('');
	const [filter, setFilter] = useState<FilterStatus>('all');
	const [previewVisible, setPreviewVisible] = useState(false);
	const [collectVisible, setCollectVisible] = useState(false);
	const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
	const [paymentAmount, setPaymentAmount] = useState('');
	const [paymentMethod, setPaymentMethod] = useState<'cash'|'upi'>('cash');
	const [upiQrData, setUpiQrData] = useState<string | null>(null);
	const [collectLoading, setCollectLoading] = useState(false);
	const startDateRef = useRef<string>('');
	const endDateRef = useRef<string>('');

	// Fetch from server whenever filters change
	useEffect(() => {
		fetchInvoices({
			q: search || undefined,
			status: filter,
			from: startDateRef.current || undefined,
			to: endDateRef.current || undefined,
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [search, filter]);

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		// server has already filtered; keep light client-side sort as fallback
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

				// Date range (invoiceDate format DD/MM/YYYY)
				const [d, m, y] = inv.invoiceDate.split('/');
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

	const openPreview = (inv: Invoice) => { setActiveInvoice(inv); setPreviewVisible(true); };
	const openCollect = (inv: Invoice) => { setActiveInvoice(inv); setCollectVisible(true); };

	const closeModals = () => { setPreviewVisible(false); setCollectVisible(false); setActiveInvoice(null); };

	const generateUpiQr = async () => {
		if (!activeInvoice) return;
		const amt = parseFloat(paymentAmount);
		if (isNaN(amt) || amt <= 0) return;
		// For now, fetch settings for UPI ID placeholder (future enhancement)
		try {
			const settings = await apiService.getSettings();
			const upiId = settings?.upiId || 'upi-placeholder@bank';
			const qr = await qrAdapter.generateUpiQrCode(upiId, amt, activeInvoice.customerName);
			if (qr.success) setUpiQrData(qr.svg || null);
		} catch (e) { console.warn('QR gen failed', e); }
	};

	const confirmCollection = async () => {
		if (!activeInvoice) return;
		const amt = parseFloat(paymentAmount);
		if (isNaN(amt) || amt <= 0) return;
		setCollectLoading(true);
		try {
			const updated = await apiService.recordInvoicePayment(activeInvoice.invoiceNumber, amt, paymentMethod);
			if (updated) {
				notificationAdapter.showNotification?.({ title: t('payment-recorded-successfully', 'Payment recorded successfully!'), body: `#${activeInvoice.invoiceNumber}` });
				fetchInvoices();
				setCollectVisible(false);
			}
		} catch (e) {
			console.error('Payment collection failed', e);
		} finally {
			setCollectLoading(false);
		}
	};

	return (
		<>
		<View style={styles.container}>
			<Text style={styles.title}>{t('page-title-invoices')}</Text>

			<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.toolbar} contentContainerStyle={styles.toolbarContent}>
				<TextInput
					value={search}
					onChangeText={setSearch}
					placeholder={t('search-invoices-placeholder', 'Search invoices...')}
					placeholderTextColor={colors.textLight}
					style={styles.search}
				/>
				<View style={styles.dateGroup}>
					<TextInput
						placeholder={t('start-date', 'Start Date')}
						placeholderTextColor={colors.textLight}
						style={styles.dateInput}
						onChangeText={(v) => { startDateRef.current = v; }}
					/>
					<TextInput
						placeholder={t('end-date', 'End Date')}
						placeholderTextColor={colors.textLight}
						style={styles.dateInput}
						onChangeText={(v) => { endDateRef.current = v; }}
					/>
				</View>
				<Button
					variant="secondary"
					style={styles.exportBtn}
					onPress={async () => {
						try {
							// columns: Invoice #, Date, Customer, Phone, Status, Total, Paid, Balance
							const cols = [
								t('invoice-number', 'Invoice #'),
								t('date', 'Date'),
								t('customer', 'Customer'),
								t('customer-phone', 'Phone'),
								t('status', 'Status'),
								t('total-amount', 'Total Amount'),
								t('paid-amount', 'Paid Amount'),
								t('balance-due-label', 'Balance Due'),
							];
							const rows = filtered.map(inv => {
								const total = inv.services.reduce((s, svc) => s + svc.price * svc.quantity, 0) * 1.18;
								const paid = (inv.payments || []).reduce((s, p) => s + p.amount, 0) + (inv.advancePaid?.amount || 0);
								const stat = calculateStatus(inv);
								const balanceDue = Math.max(0, total - paid - (inv.oldBalance?.amount || 0));
								return [
									`#${inv.invoiceNumber}`,
									inv.invoiceDate,
									inv.customerName,
									inv.customerPhone,
									t(stat),
									`₹${total.toLocaleString('en-IN')}`,
									`₹${paid.toLocaleString('en-IN')}`,
									`₹${balanceDue.toLocaleString('en-IN')}`,
								];
							});
							const title = t('invoice-list-report-title', 'Invoice List Report');
							const res = await pdfAdapter.generateSimpleListPdf?.({ title, columns: cols, rows, fileName: 'Invoice_List.pdf' });
							if (res?.success && res.filePath) {
								await pdfAdapter.openPdf?.(res.filePath);
								notificationAdapter.showNotification?.({ title: t('export-pdf', 'Export PDF'), body: t('export-pdf-success-message', 'Data exported to PDF.') });
							}
						} catch (e) {
							console.error('Export PDF failed', e);
						}
					}}
				>
					{t('export-pdf', 'Export PDF')}
				</Button>
			</ScrollView>
			<View style={styles.filterRow}>
				{(['all','outstanding','paid','unpaid','partially_paid'] as FilterStatus[]).map((key) => (
					<TouchableOpacity key={key} onPress={() => setFilter(key)} style={[styles.filterChip, filter===key && styles.filterChipActive]}>
						<Text style={[styles.filterText, filter===key && styles.filterTextActive]}>
							{t(key)}
						</Text>
					</TouchableOpacity>
				))}
			</View>

			<Text style={styles.summary}>{t('you-have-total-invoices', 'You have {count} total invoices.').replace('{count}', invoices.length.toString())}</Text>
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
									onDelete={deleteInvoice}
								/>
					)}
					contentContainerStyle={{ paddingBottom: spacing.lg }}
					refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchInvoices} />}
				/>
			)}
		</View>
        <InvoicePreviewModal visible={previewVisible} invoice={activeInvoice} onClose={()=>{setPreviewVisible(false); setActiveInvoice(null);}} />
        <PaymentModal visible={collectVisible} invoice={activeInvoice} onClose={()=>{setCollectVisible(false); setActiveInvoice(null);}} onSuccess={()=>fetchInvoices()} />

	</>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, padding: spacing.md, backgroundColor: colors.background },
	title: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
	toolbar: { marginBottom: spacing.sm },
	toolbarContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingRight: spacing.md },
	search: {
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: 8,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		color: colors.text,
		marginBottom: spacing.sm,
		backgroundColor: colors.white,
		minWidth: 180,
	},
	dateGroup: { flexDirection: 'row', gap: spacing.sm },
	dateInput: { borderWidth:1, borderColor:colors.border, borderRadius:8, paddingHorizontal:spacing.md, paddingVertical:spacing.sm, backgroundColor:colors.white, width:140, color:colors.text },
	exportBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginBottom: spacing.sm },
	filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
	filterChip: { borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: colors.white },
	filterChipActive: { backgroundColor: colors.primary },
	filterText: { ...typography.caption, color: colors.textSecondary },
	filterTextActive: { color: colors.white, fontWeight: '600' },
	summary: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm },
	previewWrapper: { gap: spacing.md },
	previewHeading: { ...typography.body, fontWeight: '600', color: colors.text },
	previewMeta: { ...typography.caption, color: colors.textSecondary },
	previewSection: { marginTop: spacing.sm, borderTopWidth:1, borderTopColor: colors.border, paddingTop: spacing.sm },
	serviceRow: { flexDirection: 'row', justifyContent:'space-between', paddingVertical:4 },
	serviceName: { ...typography.bodySmall, color: colors.text },
	serviceAmount: { ...typography.bodySmall, color: colors.text, fontWeight:'500' },
	totalsBlock: { marginTop: spacing.md, gap:4 },
	totalLine: { ...typography.bodySmall, color: colors.textSecondary },
	grandTotal: { ...typography.body, fontWeight:'600', color: colors.text },
	paidAmount: { ...typography.caption, color: colors.textSecondary },
	previewActions: { flexDirection:'row', flexWrap:'wrap', gap: spacing.sm, marginTop: spacing.md },
	collectWrapper: { gap: spacing.md },
	collectMessage: { ...typography.bodySmall, color: colors.textSecondary },
	methodRow: { flexDirection:'row', gap: spacing.sm },
	methodChip: { borderWidth:1, borderColor: colors.border, borderRadius:16, paddingVertical:6, paddingHorizontal:12, backgroundColor: colors.white },
	methodChipActive: { backgroundColor: colors.primary },
	methodText: { ...typography.caption, color: colors.textSecondary },
	methodTextActive: { color: colors.white, fontWeight:'600' },
	qrSection: { gap: spacing.sm },
	qrContainer: { alignItems:'center', justifyContent:'center', padding: spacing.sm, backgroundColor: colors.background, borderRadius:8 },
});
