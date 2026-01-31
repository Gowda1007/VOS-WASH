import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ScrollView, Linking, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { CustomerCard, EmptyState } from '../components';
import { useCustomers } from '../hooks/useCustomers';
import { useInvoices } from '../hooks/useInvoices';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { colors, spacing, typography } from '../styles/theme';
import { formatCurrency, calculateRemainingBalance } from '../core/utils/invoiceUtils'; // Added calculateRemainingBalance
import type { Customer } from '../core/types';
import { pdfAdapter } from '../adapters';

export const CustomersScreen: React.FC = () => {
	const navigation = useNavigation();
	const insets = useSafeAreaInsets();
	const { t } = useLanguage();
	const { customers, loading } = useCustomers();
	const { invoices } = useInvoices();
	const toast = useToast();
	const [search, setSearch] = useState('');
	const [typeFilter, setTypeFilter] = useState<'all' | 'customer' | 'garage_service_station' | 'dealer'>('all');

	const customersWithStats = useMemo(() => {
		const q = search.trim().toLowerCase();
		return customers
			.filter(c => !q || c.name.toLowerCase().includes(q) || c.phone.includes(q))
			.filter(c => typeFilter === 'all' || c.customerType === typeFilter)
			.map(c => {
				const invs = invoices.filter(inv => inv.customerPhone === c.phone);
				const totalSpent = invs.reduce((sum, inv) => sum + inv.services.reduce((s, svc) => s + svc.price * svc.quantity, 0), 0);
				return { ...c, invoiceCount: invs.length, totalSpent, invoices: invs }; // Include invoices for balance check
			})
			.sort((a, b) => b.totalSpent - a.totalSpent);
	}, [customers, invoices, search, typeFilter]);

	const topSpender = customersWithStats[0];

	const handleCall = async (phoneNumber: string) => {
		if (!phoneNumber) {
			toast.error(t('no-phone', 'No phone number available.'));
			return;
		}

		const url = `tel:${phoneNumber}`;
		try {
			const supported = await Linking.canOpenURL(url);
			if (supported) {
				await Linking.openURL(url);
			} else {
				toast.error(t('dialer-not-supported', 'Phone dialer is not supported on this device.'));
			}
		} catch (error) {
			console.error('Call failed:', error);
			toast.error(t('call-failed', 'Failed to initiate call.'));
		}
	};

	if (customersWithStats.length === 0) {
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
				<View style={styles.emptyContainer}>
					<EmptyState 
						icon="people" 
						title={t('no-customers-found', 'No customers found')} 
						message={t('you-have-no-customers', 'You have no customers')} 
					/>
				</View>
			</View>
		);
	}

	return (
		<View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>

			{/* Actions Row */}
			<View style={styles.actionsRow}>
				<View style={{ flex: 1 }} />
				<TouchableOpacity
					style={styles.actionButton}
					onPress={async () => {
						try {
							const columns = [
								t('customer-name', 'Customer Name'),
								t('contact', 'Contact'),
								t('type', 'Type'),
								t('invoices', 'Invoices'),
								t('total-spent', 'Total Spent'),
							];
							const rows = customersWithStats.map(c => [
								c.name,
								c.phone,
								t(c.customerType || 'customer'),
								String(c.invoiceCount ?? 0),
								formatCurrency(c.totalSpent ?? 0),
							]);
							const result = await pdfAdapter.generateSimpleListPdf({
								title: t('customers-export-title', 'Customers List'),
								columns,
								rows,
								fileName: 'Customers_List.pdf',
							});
							if (result.success) {
								toast.success(t('export-success', 'Exported customers PDF'));
							} else {
								toast.error(t('export-failed', 'Failed to export PDF'));
							}
						} catch (e) {
							toast.error(t('export-failed', 'Failed to export PDF'));
						}
					}}
				>
					<MaterialIcons name="picture-as-pdf" size={18} color={colors.primary} />
					<Text style={styles.actionButtonText}>{t('export', 'Export')}</Text>
				</TouchableOpacity>
			</View>
			
			<TextInput
				value={search}
				onChangeText={setSearch}
				placeholder={t('search-customers-placeholder', 'Search by name or phone...')}
				placeholderTextColor={colors.textLight}
				style={styles.search}
			/>

			{/* Type Filter Chips */}
			<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
				{(['all', 'customer', 'garage_service_station', 'dealer'] as const).map(type => {
					const getChipColor = () => {
						if (typeFilter !== type) return colors.white;
						switch(type) {
							case 'garage_service_station': return colors.info;
							case 'dealer': return colors.warning;
							case 'customer': return colors.success;
							default: return colors.primary;
						}
					};
					const getBorderColor = () => {
						if (typeFilter === type) return getChipColor();
						return colors.border;
					};
					return (
						<TouchableOpacity
							key={type}
							style={[styles.filterChip, { backgroundColor: getChipColor(), borderColor: getBorderColor() }]}
							onPress={() => setTypeFilter(type)}
						>
							<Text style={[styles.filterChipText, typeFilter === type && styles.filterChipTextActive]}>
								{type === 'all' ? t('all', 'All') : 
								 type === 'customer' ? t('customer', 'Customer') :
								 type === 'dealer' ? t('dealer', 'Dealer') :
								 t('garage_service_station', 'Garage / Service Station')}
							</Text>
						</TouchableOpacity>
					);
				})}
			</ScrollView>

			{/* Stats Section - Compact */}
			<View style={styles.statsRow}>
				<View style={styles.statBox}>
					<Text style={styles.statLabel}>{t('total-customers', 'Total Customers')}</Text>
					<Text style={styles.statValue}>{customersWithStats.length}</Text>
				</View>
				{topSpender && (
					<View style={styles.statBox}>
						<Text style={styles.statLabel}>{t('top-spender', 'Top Spender')}</Text>
						<Text style={styles.statValue} numberOfLines={1}>{topSpender.name}</Text>
						<Text style={styles.statAmount}>{formatCurrency(topSpender.totalSpent)}</Text>
					</View>
				)}
			</View>

			{/* Summary */}
			<Text style={styles.summary}>
				{t('you-have-unique-customers', 'You have {count} unique customers.').replace('{count}', customersWithStats.length.toString())}
			</Text>

			{/* Customer List - Card based */}
			<FlatList
				data={customersWithStats}
				keyExtractor={(item: Customer) => item.phone}
				renderItem={({ item }) => (
					<CustomerCardItem 
						customer={item as any} 
						onView={() => (navigation as any).navigate('CustomerDetail', { customerPhone: item.phone, customerName: item.name })} 
						onCall={handleCall}
					/>
				)}
				contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: insets.bottom + 150 }}
				showsVerticalScrollIndicator={false}
			/>
		</View>
	);
};

const CustomerCardItem: React.FC<{ customer: any; onView: () => void; onCall: (phone: string) => void }> = ({ customer, onView, onCall }) => {
	const { t } = useLanguage();
	
	const getTypeBadgeColor = (type?: string) => {
		switch(type) {
			case 'garage_service_station': return colors.info; // Blue
			case 'dealer': return colors.warning; // Orange
			case 'customer': return colors.success; // Green
			default: return colors.primary;
		}
	};
	
	const remainingBalance = customer.invoices.reduce((sum: number, inv: any) => sum + calculateRemainingBalance(inv), 0);
	const isOutstanding = remainingBalance > 0;

	return (
		<TouchableOpacity 
			style={[styles.customerCard, { borderLeftWidth: 6, borderLeftColor: getTypeBadgeColor(customer.customerType) }]}
			onPress={onView}
			activeOpacity={0.7}
		>
			<View style={styles.cardHeader}>
				<View style={styles.customerInfo}>
					<Text style={styles.customerName} numberOfLines={1}>{customer.name}</Text>
				</View>
				<View style={styles.cardActions}>
				<TouchableOpacity onPress={() => onCall(customer.phone)} style={styles.iconButton}>
					<MaterialIcons name="phone" size={26} color={colors.primary} />
				</TouchableOpacity>
				</View>
			</View>
			
			<View style={styles.cardBody}>
							<View style={styles.infoRow}>
								<MaterialIcons name="phone-android" size={16} color={colors.textSecondary} />
								<Text style={styles.infoText}>{customer.phone}</Text>
							</View>				<View style={styles.cardFooter}>
					<View style={styles.statItem}>
						<MaterialIcons name="receipt" size={16} color={colors.textSecondary} />
						<Text style={styles.statText}>{customer.invoiceCount} {t('invoices', 'Invoices')}</Text>
					</View>
					<View style={styles.statItem}>
						<Text style={styles.totalSpentText}>{formatCurrency(customer.totalSpent)}</Text>
					</View>
					{isOutstanding && (
						<View style={styles.unpaidBadge}>
							<MaterialIcons name="warning" size={14} color={colors.white} />
							<Text style={styles.unpaidBadgeText}>{t('unpaid-tag', 'Unpaid')}</Text>
						</View>
					)}
				</View>
			</View>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	container: { 
		flex: 1, 
		padding: spacing.md, 
		backgroundColor: colors.background,
	},
	title: { 
		...typography.h3, 
		color: colors.text, 
		marginBottom: spacing.md,
		fontWeight: '600',
	},
	actionsRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: spacing.sm,
	},
	actionButton: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
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
		marginBottom: spacing.md,
		flexGrow: 0,
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
		marginRight: spacing.sm,
	},
	filterChipText: {
		...typography.bodySmall,
		color: colors.text,
		fontWeight: '500',
	},
	filterChipTextActive: {
		color: colors.white,
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	statsRow: { 
		flexDirection: 'row', 
		gap: spacing.sm, 
		marginTop: spacing.md,
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
		...typography.h3,
		color: colors.text, 
		fontWeight: '600',
		fontSize: 18,
	},
	statAmount: {
		...typography.caption,
		color: colors.textSecondary,
		marginTop: 2,
	},
	summary: { 
		...typography.caption, 
		color: colors.textSecondary, 
		marginBottom: spacing.md,
	},
	customerCard: {
		backgroundColor: colors.white,
		borderRadius: 12,
		padding: spacing.sm,
		marginBottom: spacing.sm,
		borderWidth: 1,
		borderColor: colors.border,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	},
	cardHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginBottom: spacing.xs,
	},
	customerInfo: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.sm,
	},
	customerName: {
		...typography.body,
		color: colors.text,
		fontWeight: '600',
		fontSize: 16,
		flex: 1,
	},
	cardActions: {
		flexDirection: 'row',
		gap: spacing.xs,
	},
	iconButton: {
		padding: spacing.sm,
		borderRadius: 8,
		backgroundColor: colors.surface,
		minWidth: 40,
		minHeight: 40,
		alignItems: 'center',
		justifyContent: 'center',
	},
	cardBody: {
		gap: spacing.sm,
	},
	infoRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.xs,
	},
	infoText: {
		...typography.bodySmall,
		color: colors.textSecondary,
	},
	cardFooter: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.md,
		marginTop: spacing.xs,
		flexWrap: 'wrap',
	},
	statItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
	statText: {
		...typography.caption,
		color: colors.textSecondary,
	},
	totalSpentText: {
		...typography.bodySmall,
		color: colors.success,
		fontWeight: '600',
	},
	unpaidBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		backgroundColor: colors.warning,
		paddingHorizontal: spacing.sm,
		paddingVertical: 4,
		borderRadius: 6,
	},
	unpaidBadgeText: {
		...typography.caption,
		color: colors.white,
		fontWeight: '600',
		fontSize: 11,
	},
	typeBadge: {
		paddingHorizontal: spacing.sm,
		paddingVertical: 4,
		borderRadius: 6,
		alignSelf: 'flex-start',
	},
	typeBadgeText: {
		...typography.caption,
		color: colors.white,
		fontWeight: '600',
		fontSize: 10,
	},
});
