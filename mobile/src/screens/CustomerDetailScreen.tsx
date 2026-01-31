import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Linking } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useInvoices } from '../hooks/useInvoices';
import { useCustomers } from '../hooks/useCustomers';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { colors, spacing, typography } from '../styles/theme';
import { formatCurrency, calculateRemainingBalance } from '../core/utils/invoiceUtils';
import type { Invoice, Customer } from '../core/types';
import { Modal, Button } from '../components/Common';
import { InvoicePreviewScreen, PaymentModal } from '../components';
import { useAppSettings } from '../hooks/useAppSettings';
import { getPdfAdapter } from '../services';

export const CustomerDetailScreen: React.FC = () => {
	const route = useRoute();
	const navigation = useNavigation();
	const { t, language } = useLanguage();
	const { invoices } = useInvoices();
	const { customers, addOrUpdateCustomer, deleteCustomer, isCustomerExists } = useCustomers();
	const toast = useToast();
	const { settings: appSettings } = useAppSettings();
	
	const customerPhone = (route.params as any)?.customerPhone;
	const customerName = (route.params as any)?.customerName;
	
	const [isEditModalVisible, setIsEditModalVisible] = useState(false);
	const [editName, setEditName] = useState(customerName);
	const [editAddress, setEditAddress] = useState('');
	const [editGstNumber, setEditGstNumber] = useState('');
	const [editPhone, setEditPhone] = useState(customerPhone);
	const [isDeleting, setIsDeleting] = useState(false);
	const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
	const [collectPaymentInvoice, setCollectPaymentInvoice] = useState<Invoice | null>(null);

	const currentCustomer = useMemo(() => {
		return customers.find(c => c.phone === customerPhone);
	}, [customers, customerPhone]);
	
	const getTypeBadgeColor = (type?: string) => {
		switch(type) {
			case 'garage_service_station': return colors.info;
			case 'dealer': return colors.warning;
			default: return colors.primary;
		}
	};

	// Set initial address when customer is loaded
	React.useEffect(() => {
		if (currentCustomer) {
			setEditAddress(currentCustomer.address);
			setEditGstNumber(currentCustomer.gstNumber || '');
			setEditPhone(currentCustomer.phone);
		}
	}, [currentCustomer]);

	const customerData = useMemo(() => {
		const invs = invoices.filter(inv => inv.customerPhone === customerPhone);
		const totalRevenue = invs.reduce((sum, inv) => {
			return sum + inv.services.reduce((s, svc) => s + svc.price * svc.quantity, 0);
		}, 0);
		const totalPaid = invs.reduce((sum, inv) => {
			const payments = inv.payments || [];
			const advancePaid = inv.advancePaid?.amount || 0;
			return sum + payments.reduce((pSum, p) => pSum + (Number(p.amount) || 0), 0) + (Number(advancePaid) || 0);
		}, 0);
		const totalUnpaid = invs.reduce((sum, inv) => {
			const balance = calculateRemainingBalance(inv);
			return sum + (balance > 0 ? balance : 0);
		}, 0);

		return {
			invoices: invs,
			totalRevenue,
			totalPaid,
			totalUnpaid,
		};
	}, [invoices, customerPhone]);

	const handleViewInvoice = (invoice: Invoice) => {
		setPreviewInvoice(invoice);
	};

	const handleEditCustomer = async () => {
		if (!editName.trim()) {
			toast.error(t('enter-valid-name', 'Customer name is required'));
			return;
		}

		const normalizedPhone = (editPhone || '').replace(/\D/g, '');
		if (!normalizedPhone || normalizedPhone.length < 8) {
			toast.error(t('enter-valid-phone', 'Enter a valid phone number'));
			return;
		}

		if (normalizedPhone !== customerPhone) {
			const exists = await isCustomerExists(normalizedPhone);
			if (exists) {
				toast.error(t('phone-already-exists', 'Phone number already exists'));
				return;
			}
		}

		try {
			const updatedCustomer: Customer = {
				phone: normalizedPhone,
				name: editName.trim(),
				gstNumber: editGstNumber.trim() || undefined,
				address: editAddress.trim(),
			};
			await addOrUpdateCustomer(updatedCustomer);
			toast.success(t('customer-updated', 'Customer updated successfully!'));
			setIsEditModalVisible(false);
			// Navigate back as data may have changed (including phone)
			setTimeout(() => (navigation as any).goBack(), 1000);
		} catch (error) {
			toast.error(t('error-updating-customer', 'Error updating customer'));
			console.error('Error updating customer:', error);
		}
	};

	const [confirmDeleteCustomer, setConfirmDeleteCustomer] = useState(false);

	const handleDeleteCustomer = () => {
		setConfirmDeleteCustomer(true);
	};

	const confirmDeleteCustomerAction = async () => {
		try {
			setIsDeleting(true);
			await deleteCustomer(customerPhone);
			toast.success(t('customer-deleted', 'Customer deleted successfully!'));
			setConfirmDeleteCustomer(false);
			setIsDeleting(false);
			setTimeout(() => (navigation as any).goBack(), 1000);
		} catch (error) {
			toast.error(t('error-deleting-customer', 'Error deleting customer'));
			console.error('Error deleting customer:', error);
			setIsDeleting(false);
		}
	};

	const handleExportTransactions = async () => {
		try {
			const columns = [
				t('invoice-number', 'Invoice #'),
				t('date', 'Date'),
				t('total', 'Total'),
				t('paid', 'Paid'),
				t('balance', 'Balance'),
				t('status', 'Status'),
			];
			const rows = customerData.invoices.map(inv => {
				const total = inv.services.reduce((sum, svc) => sum + svc.price * svc.quantity, 0);
				const paid = (inv.payments || []).reduce((s, p) => s + (Number(p.amount) || 0), 0) + (Number(inv.advancePaid?.amount) || 0);
				const balance = calculateRemainingBalance(inv);
				const status = balance > 0 ? t('unpaid', 'Unpaid') : t('paid', 'Paid');
				return [
					`#${inv.invoiceNumber}`,
					inv.invoiceDate,
					formatCurrency(total),
					formatCurrency(paid),
					formatCurrency(Math.max(balance, 0)),
					status,
				];
			});
		const title = `${t('transactions-for', 'Transactions for')} ${customerName}`;
		const pdfAdapter = getPdfAdapter();
		const result = await pdfAdapter.generateSimpleListPdf({ title, columns, rows, fileName: `Transactions_${customerName}.pdf` });
			if (result.success) {
				toast.success(t('export-success', 'Exported customers PDF'));
			} else {
				toast.error(t('export-failed', 'Failed to export PDF'));
			}
		} catch (e) {
			toast.error(t('export-failed', 'Failed to export PDF'));
		}
	};

	const handleCallCustomer = async () => {
		try {
			// Ensure phone number is clean for reliable dialer opening
			const cleanedPhone = customerPhone.replace(/[^\d+]/g, '');
			const phoneUrl = `tel:${cleanedPhone}`;
			const canOpen = await Linking.canOpenURL(phoneUrl);
			
			if (canOpen) {
				await Linking.openURL(phoneUrl);
			} else {
				toast.error(t('cannot-make-call', 'Unable to open phone dialer. Check permissions or phone format.'));
			}
		} catch (error) {
			console.error('Error opening phone dialer:', error);
			toast.error(t('call-failed', 'Failed to open dialer'));
		}
	};

	return (
		<View style={styles.container}>
			<ScrollView>
				{/* Header Card with Action Buttons */}
				<View style={styles.headerCard}>
					<View style={styles.headerContent}>
						<MaterialIcons name="person" size={32} color={colors.primary} />
						<View style={styles.headerText}>
							<Text style={styles.customerName}>{customerName}</Text>
							<Text style={styles.customerPhone}>{customerPhone}</Text>
							{currentCustomer?.gstNumber && (
								<Text style={[styles.customerPhone, { fontSize: 13, marginTop: 2 }]}>
									GST: {currentCustomer.gstNumber}
								</Text>
							)}
							{currentCustomer?.customerType && (
								<View style={[styles.typeBadge, { backgroundColor: getTypeBadgeColor(currentCustomer.customerType) }]}>
									<Text style={styles.typeBadgeText}>{t(currentCustomer.customerType)}</Text>
								</View>
							)}
						</View>
					</View>
					<View style={styles.actionButtons}>
						<TouchableOpacity
							style={styles.actionButton}
							onPress={handleCallCustomer}
							disabled={isDeleting}
						>
							<MaterialIcons name="phone" size={20} color={colors.success} />
							<Text style={[styles.actionButtonText, { color: colors.success }]}>{t('call', 'Call')}</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.actionButton}
							onPress={() => setIsEditModalVisible(true)}
							disabled={isDeleting}
						>
							<MaterialIcons name="edit" size={20} color={colors.primary} />
							<Text style={styles.actionButtonText}>{t('edit')}</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.actionButton}
							onPress={handleExportTransactions}
							disabled={isDeleting}
						>
							<MaterialIcons name="picture-as-pdf" size={20} color={colors.primary} />
							<Text style={styles.actionButtonText}>{t('export', 'Export')}</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.actionButton, styles.deleteButton]}
							onPress={handleDeleteCustomer}
							disabled={isDeleting}
						>
							<MaterialIcons name="delete" size={20} color={colors.error} />
							<Text style={[styles.actionButtonText, { color: colors.error }]}>{t('delete')}</Text>
						</TouchableOpacity>
					</View>
				</View>

				{/* Stats Grid */}
				<View style={styles.statsGrid}>
					<View style={styles.statCard}>
						<Text style={styles.statLabel}>{t('total-revenue', 'Total Revenue')}</Text>
						<Text style={styles.statValue}>{formatCurrency(customerData.totalRevenue)}</Text>
					</View>
					<View style={styles.statCard}>
						<Text style={styles.statLabel}>{t('collected', 'Collected')}</Text>
						<Text style={[styles.statValue, { color: colors.success }]}>
							{formatCurrency(customerData.totalPaid)}
						</Text>
					</View>
					<View style={styles.statCard}>
						<Text style={styles.statLabel}>{t('unpaid-balance', 'Unpaid Balance')}</Text>
						<Text style={[styles.statValue, { color: customerData.totalUnpaid > 0 ? colors.error : colors.success }]}>
							{formatCurrency(customerData.totalUnpaid)}
						</Text>
					</View>
					<View style={styles.statCard}>
						<Text style={styles.statLabel}>{t('total-invoices', 'Total Invoices')}</Text>
						<Text style={styles.statValue}>{customerData.invoices.length}</Text>
					</View>
				</View>

				{/* Invoices Section */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>{t('invoices', 'Invoices')}</Text>
					{customerData.invoices.length === 0 ? (
						<Text style={styles.emptyText}>{t('no-invoices', 'No invoices found')}</Text>
					) : (
						<View style={styles.invoicesList}>
							{customerData.invoices.map((invoice) => {
								const balance = calculateRemainingBalance(invoice);
								const status = balance > 0 ? 'unpaid' : 'paid';
								const statusColor = status === 'paid' ? colors.success : colors.error;
								return (
									<TouchableOpacity
										key={invoice.invoiceNumber}
										style={styles.invoiceItem}
										onPress={() => handleViewInvoice(invoice)}
										activeOpacity={0.7}
									>
										<View style={styles.invoiceInfo}>
											<Text style={styles.invoiceNumber}>#{invoice.invoiceNumber}</Text>
											<Text style={styles.invoiceDate}>{invoice.invoiceDate}</Text>
										</View>
										<View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
											<Text style={styles.invoiceAmount}>
												{formatCurrency(invoice.services.reduce((sum, svc) => sum + svc.price * svc.quantity, 0))}
											</Text>
											{status !== 'paid' && (
												<TouchableOpacity onPress={handleCallCustomer} style={styles.callButton}>
													<MaterialIcons name="phone" size={16} color={colors.success} />
												</TouchableOpacity>
											)}
											<View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
												<Text style={styles.statusText}>
													{status === 'paid' ? t('paid', 'Paid') : t('unpaid', 'Unpaid')}
												</Text>
											</View>
										</View>
									</TouchableOpacity>
								);
							})}
						</View>
					)}
				</View>
			</ScrollView>

			{/* Delete Customer Confirmation Modal */}
			<Modal
				visible={confirmDeleteCustomer}
				onClose={() => setConfirmDeleteCustomer(false)}
				title={t('confirm-delete-customer', 'Delete Customer')}
			>
				<View style={styles.modalContent}>
					<Text style={styles.label}>
						{t('confirm-delete-customer-message', 'Are you sure you want to delete this customer? This action cannot be undone.')}
					</Text>
					<Text style={[styles.label, { marginTop: spacing.sm }]}>
						{t('total-invoices', 'Total Invoices')}: {customerData.invoices.length}
					</Text>
					<View style={styles.modalActions}>
						<Button
							variant="secondary"
							onPress={() => setConfirmDeleteCustomer(false)}
							style={{ flex: 1 }}
						>
							{t('cancel')}
						</Button>
						<Button
							variant="danger"
							onPress={confirmDeleteCustomerAction}
							style={{ flex: 1 }}
							disabled={isDeleting}
							loading={isDeleting}
						>
							{t('delete')}
						</Button>
					</View>
				</View>
			</Modal>

			{/* Edit Customer Modal */}
			<Modal
				visible={isEditModalVisible}
				onClose={() => setIsEditModalVisible(false)}
				title={t('edit-customer', 'Edit Customer Details')}
			>
				<View style={styles.modalContent}>
					<View style={styles.inputGroup}>
						<Text style={styles.label}>{t('customer-name')}</Text>
						<TextInput
							style={styles.input}
							placeholder={t('customer-name')}
							value={editName}
							onChangeText={setEditName}
						/>
					</View>
					
					<View style={styles.inputGroup}>
						<Text style={styles.label}>{t('gst-number') || 'GST Number'}</Text>
						<TextInput
							style={styles.input}
							placeholder={t('gst-number') || 'GST Number'}
							value={editGstNumber}
							onChangeText={setEditGstNumber}
							autoCapitalize="characters"
						/>
					</View>
					<View style={styles.inputGroup}>
						<Text style={styles.label}>{t('customer-phone', 'Customer Phone')}</Text>
						<TextInput
							style={styles.input}
							placeholder={t('customer-phone', 'Customer Phone')}
							keyboardType="phone-pad"
							value={editPhone}
							onChangeText={setEditPhone}
						/>
					</View>
					<View style={styles.inputGroup}>
						<Text style={styles.label}>{t('customer-address')}</Text>
						<TextInput
							style={[styles.input, styles.textAreaInput]}
							placeholder={t('customer-address')}
							value={editAddress}
							onChangeText={setEditAddress}
							multiline
							numberOfLines={3}
						/>
					</View>
					<View style={styles.modalActions}>
						<Button
							variant="secondary"
							onPress={() => setIsEditModalVisible(false)}
							style={{ flex: 1 }}
						>
							{t('cancel')}
						</Button>
						<Button
							onPress={handleEditCustomer}
							style={{ flex: 1 }}
						>
							{t('save')}
						</Button>
					</View>
				</View>
			</Modal>

			{/* Invoice Preview */}
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
							setCollectPaymentInvoice(previewInvoice);
							setPreviewInvoice(null);
						}}
					/>
				</Modal>
			)}

			{/* Payment Collection Modal */}
			<PaymentModal
				visible={!!collectPaymentInvoice}
				invoice={collectPaymentInvoice}
				onClose={() => setCollectPaymentInvoice(null)}
				onSuccess={() => {
					setCollectPaymentInvoice(null);
					// Refresh would happen automatically via hooks
				}}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background,
	},
	headerCard: {
		backgroundColor: colors.white,
		padding: spacing.lg,
		marginHorizontal: spacing.md,
		marginTop: spacing.md,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: colors.border,
	},
	headerContent: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.md,
	},
	headerText: {
		flex: 1,
	},
	actionButtons: {
		flexDirection: 'row',
	    flexWrap: 'wrap',
		gap: spacing.sm,
		marginTop: spacing.md,
	       justifyContent: 'space-between'
	},
	actionButton: {
	    width: '48%', // Explicit width for 2 items per row
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: spacing.xs,
		paddingVertical: spacing.sm, // Reduced vertical padding
		paddingHorizontal: spacing.sm, // Reduced horizontal padding
		borderRadius: 8,
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
	       marginBottom: spacing.sm, // Add vertical spacing between rows
	},
	deleteButton: {
		borderColor: colors.error,
		backgroundColor: colors.surface,
	},
	actionButtonText: {
		...typography.body,
		color: colors.primary,
		fontWeight: '600',
	},
	customerName: {
		...typography.h3,
		color: colors.text,
		fontWeight: '600',
		marginBottom: 4,
	},
	customerPhone: {
		...typography.body,
		color: colors.textSecondary,
	},
	typeBadge: {
		paddingHorizontal: spacing.sm,
		paddingVertical: 4,
		borderRadius: 4,
		marginTop: spacing.xs,
		alignSelf: 'flex-start',
	},
	typeBadgeText: {
		...typography.caption,
		color: colors.white,
		fontWeight: '600',
		fontSize: 11,
	},
	statsGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: spacing.sm,
		padding: spacing.md,
	},
	statCard: {
		width: '48%',
		backgroundColor: colors.white,
		padding: spacing.md,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: colors.border,
	},
	statLabel: {
		...typography.caption,
		color: colors.textSecondary,
		marginBottom: 4,
	},
	statValue: {
		...typography.h3,
		color: colors.text,
		fontWeight: '600',
		fontSize: 16,
	},
	section: {
		padding: spacing.md,
	},
	sectionTitle: {
		...typography.h3,
		color: colors.text,
		fontWeight: '600',
		marginBottom: spacing.md,
	},
	invoicesList: {
		backgroundColor: colors.white,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: colors.border,
		overflow: 'hidden',
	},
	invoiceItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: spacing.md,
		borderBottomWidth: 1,
		borderBottomColor: colors.borderLight,
	},
	invoiceInfo: {
		flex: 1,
	},
	invoiceNumber: {
		...typography.body,
		color: colors.primary,
		fontWeight: '600',
		marginBottom: 4,
	},
	invoiceDate: {
		...typography.caption,
		color: colors.textSecondary,
	},
	invoiceRight: {
		alignItems: 'flex-end',
		gap: spacing.xs,
	       flexDirection: 'row', // Change to row to align amount and call button
	       justifyContent: 'space-between',
	       minWidth: 120, // Ensure space for amount and call button
	},
	callButton: {
	       marginLeft: spacing.sm,
	       padding: spacing.xs,
	},
	invoiceAmount: {
		...typography.body,
		color: colors.text,
		fontWeight: '600',
	},
	statusBadge: {
		paddingHorizontal: spacing.sm,
		paddingVertical: 3,
		borderRadius: 4,
	},
	statusText: {
		...typography.caption,
		color: colors.white,
		fontWeight: '600',
		fontSize: 10,
	},
	emptyText: {
		...typography.body,
		color: colors.textSecondary,
		textAlign: 'center',
		paddingVertical: spacing.lg,
	},
	modalContent: {
		paddingHorizontal: spacing.md,
	},
	inputGroup: {
		marginBottom: spacing.md,
	},
	label: {
		...typography.bodySmall,
		fontWeight: '600',
		color: colors.text,
		marginBottom: spacing.xs,
	},
	input: {
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: 8,
		padding: spacing.md,
		color: colors.text,
		backgroundColor: colors.white,
		...typography.body,
	},
	textAreaInput: {
		height: 100,
		textAlignVertical: 'top',
	},
	modalActions: {
		flexDirection: 'row',
		gap: spacing.md,
		marginTop: spacing.md,
	},
});
