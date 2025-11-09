import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput } from 'react-native';
import { CustomerCard, EmptyState } from '../components';
import { useCustomers } from '../hooks/useCustomers';
import { useInvoices } from '../hooks/useInvoices';
import { useLanguage } from '../context/LanguageContext';
import { colors, spacing, typography } from '../styles/theme';
import type { Customer } from '../core/types';

export const CustomersScreen: React.FC = () => {
	const { t } = useLanguage();
	const { customers, loading } = useCustomers();
	const { invoices } = useInvoices();
	const [search, setSearch] = useState('');

	const customersWithStats = useMemo(() => {
		const q = search.trim().toLowerCase();
		return customers
			.filter(c => !q || c.name.toLowerCase().includes(q) || c.phone.includes(q))
			.map(c => {
				const invs = invoices.filter(inv => inv.customerPhone === c.phone);
				const totalSpent = invs.reduce((sum, inv) => sum + inv.services.reduce((s, svc) => s + svc.price * svc.quantity, 0), 0);
				return { ...c, invoiceCount: invs.length, totalSpent };
			})
			.sort((a, b) => b.totalSpent - a.totalSpent);
	}, [customers, invoices, search]);

		const topSpender = customersWithStats[0];

		return (
		<View style={styles.container}>
			<Text style={styles.title}>{t('page-title-customers')}</Text>
			<TextInput
				value={search}
				onChangeText={setSearch}
					placeholder={t('search-customers-placeholder', 'Search by name or phone...')}
				placeholderTextColor={colors.textLight}
				style={styles.search}
			/>

				{customersWithStats.length === 0 ? (
					<EmptyState icon="people" title={t('no-customers-found', 'No customers found')} message={t('you-have-no-customers', 'You have no customers')} />
					) : (
						<>
							<View style={styles.statsRow}>
								<View style={styles.statBox}>
									<Text style={styles.statLabel}>{t('total-customers', 'Total Customers')}</Text>
									<Text style={styles.statValue}>{customersWithStats.length}</Text>
								</View>
								{topSpender && (
									<View style={styles.statBox}>
										<Text style={styles.statLabel}>{t('top-spender', 'Top Spender')}</Text>
										<Text style={styles.statValue} numberOfLines={1}>{topSpender.name} · ₹{topSpender.totalSpent.toLocaleString('en-IN')}</Text>
									</View>
								)}
							</View>
							<Text style={styles.summary}>{t('you-have-unique-customers', 'You have {count} unique customers.').replace('{count}', customersWithStats.length.toString())}</Text>
							<FlatList
					data={customersWithStats}
					keyExtractor={(item: Customer) => item.phone}
					renderItem={({ item }) => (
						<CustomerCard customer={item as any} onView={() => {}} />
					)}
					contentContainerStyle={{ paddingBottom: spacing.lg }}
						/>
						</>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, padding: spacing.md, backgroundColor: colors.background },
	title: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
	search: {
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: 8,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		color: colors.text,
		marginBottom: spacing.md,
		backgroundColor: colors.white,
	},
		summary: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm },
		statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.sm },
		statBox: { flexGrow: 1, minWidth: 160, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: spacing.sm },
		statLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: 4 },
		statValue: { ...typography.body, color: colors.text, fontWeight: '600' },
});
