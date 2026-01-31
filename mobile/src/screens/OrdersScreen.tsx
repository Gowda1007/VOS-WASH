import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { OrderCard, EmptyState, Modal, Button } from '../components';
import { useNavigation } from '@react-navigation/native';
import { usePendingOrders } from '../hooks/usePendingOrders';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { colors, spacing, typography } from '../styles/theme';
import type { PendingOrder } from '../core/types';
import { apiService } from '../services';

export const OrdersScreen: React.FC = () => {
	const { t } = useLanguage();
	const { pendingOrders, loading, deletePendingOrder, fetchOrders } = usePendingOrders();
	const navigation = useNavigation();
	const toast = useToast();
	const [search, setSearch] = useState('');
	const [urgentOnly, setUrgentOnly] = useState(false);
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [activeOrder, setActiveOrder] = useState<PendingOrder | null>(null);

	const handleDeleteOrder = async () => {
		if (!activeOrder) return;
		try {
			await deletePendingOrder(activeOrder.id);
			toast.success(t('delete-order-success', 'Pending order deleted.'));
			setConfirmDelete(false);
			setActiveOrder(null);
		} catch (e) {
			toast.error(t('error-deleting-order', 'Error deleting order'));
			setConfirmDelete(false);
			setActiveOrder(null);
		}
	};

	useEffect(() => {
		fetchOrders({ q: search || undefined, urgent: urgentOnly || undefined });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [search, urgentOnly]);

	const handleSendBotInvoice = async (order: PendingOrder) => {
		try {
			// Calculate total or use placeholder
			const amount = order.services.reduce((sum, s) => sum + (Number(s.price) || 0), 0) || 500; // Default 500 if 0
			await apiService.sendBotInvoice(order.customerPhone, amount, order.services[0]?.name || 'Service');
			toast.success(t('invoice-sent', 'Invoice Sent via Bot'));
		} catch (e) {
			toast.error(t('error-sending-invoice', 'Failed to send invoice'));
		}
	};

	const handleRequestBotPayment = async (order: PendingOrder) => {
		try {
			const amount = order.services.reduce((sum, s) => sum + (Number(s.price) || 0), 0) || 500;
			await apiService.requestBotPayment(order.customerPhone, amount);
			toast.success(t('payment-requested', 'Payment Requested via Bot'));
		} catch (e) {
			toast.error(t('error-requesting-payment', 'Failed to request payment'));
		}
	};

	return (
		<>
		<View style={styles.container}>
			<Text style={styles.title}>{t('pending-orders')}</Text>
			<View style={styles.toolbar}>
				<TextInput
					value={search}
					onChangeText={setSearch}
					placeholder={t('search-orders-placeholder', 'Search pending orders...')}
					placeholderTextColor={colors.textLight}
					style={styles.search}
				/>
				<TouchableOpacity onPress={() => setUrgentOnly(prev => !prev)} style={[styles.chip, urgentOnly && styles.chipActive]}>
					<Text style={[styles.chipText, urgentOnly && styles.chipTextActive]}>{t('urgent', 'Urgent')}</Text>
				</TouchableOpacity>
			</View>
			{pendingOrders.length === 0 ? (
				<EmptyState icon="list-alt" title={t('no-orders', 'No Pending Orders')} message={t('no-orders-message', 'Create a new order from Dashboard.')} />
			) : (
				<FlatList
					data={pendingOrders}
					keyExtractor={(item) => item.id}
					renderItem={({ item }) => (
						<OrderCard 
							order={item} 
							onGenerateInvoice={(order) => (navigation as any).navigate('NewInvoice', { fromOrder: order })} 
							onSendBotInvoice={handleSendBotInvoice}
							onRequestBotPayment={handleRequestBotPayment}
							onDelete={(orderId) => { setActiveOrder(item); setConfirmDelete(true); }} 
						/>
					)}
					contentContainerStyle={{ paddingBottom: spacing.lg }}
				/>
			)}
		</View>

		{/* Confirm Delete Modal */}
		<Modal visible={confirmDelete} onClose={() => setConfirmDelete(false)} title={t('confirm-order-deletion-title', 'Delete Order?')}>
			<Text style={{ marginBottom: spacing.md }}>
				{t('confirm-order-deletion-message', 'Are you sure you want to delete this order?').replace('{customerName}', activeOrder?.customerName || '')}
			</Text>
			<View style={{ flexDirection: 'row', gap: spacing.md }}>
				<Button variant="secondary" onPress={() => setConfirmDelete(false)}>{t('cancel', 'Cancel')}</Button>
				<Button variant="danger" onPress={handleDeleteOrder}>{t('delete', 'Delete')}</Button>
			</View>
		</Modal>
	</>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, padding: spacing.md, backgroundColor: colors.background },
	title: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
	toolbar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
	search: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.white, color: colors.text, flex: 1 },
	chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: colors.white },
	chipActive: { backgroundColor: colors.primary },
	chipText: { ...typography.caption, color: colors.textSecondary },
	chipTextActive: { color: colors.white, fontWeight: '600' },
});
