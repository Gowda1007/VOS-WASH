import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { OrderCard, EmptyState } from '../components';
import { usePendingOrders } from '../hooks/usePendingOrders';
import { useLanguage } from '../context/LanguageContext';
import { colors, spacing, typography } from '../styles/theme';

export const OrdersScreen: React.FC = () => {
	const { t } = useLanguage();
	const { pendingOrders, loading, deletePendingOrder, fetchOrders } = usePendingOrders();
	const [search, setSearch] = useState('');
	const [urgentOnly, setUrgentOnly] = useState(false);

	useEffect(() => {
		fetchOrders({ q: search || undefined, urgent: urgentOnly || undefined });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [search, urgentOnly]);

	return (
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
						<OrderCard order={item} onGenerateInvoice={() => {}} onDelete={deletePendingOrder} />
					)}
					contentContainerStyle={{ paddingBottom: spacing.lg }}
				/>
			)}
		</View>
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
