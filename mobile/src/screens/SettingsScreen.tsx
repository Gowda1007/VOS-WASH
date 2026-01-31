import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { colors, spacing, typography } from '../styles/theme';
import { useAppSettings } from '../hooks/useAppSettings';
import { useServices } from '../hooks/useServices';
import { useToast } from '../context/ToastContext';
import type { CustomerType, ServiceSets } from '../core/types';
import { Modal, Button } from '../components';

const parseNumeric = (value: unknown): number | undefined => {
	const num = Number(value);
	return Number.isFinite(num) && num >= 0 ? num : undefined;
};

export const SettingsScreen: React.FC = () => {
	const insets = useSafeAreaInsets();
	const { language, setLanguage, t } = useLanguage();
	const { settings, saveSettings } = useAppSettings();
	const { serviceSets, saveServiceSets } = useServices();
	const toast = useToast();
	const [local, setLocal] = useState(settings);
	const [localServices, setLocalServices] = useState<ServiceSets>(serviceSets);
	const [saving, setSaving] = useState(false);
	const [selectedCustomerType, setSelectedCustomerType] = useState<CustomerType>('customer');
	const [serviceToDelete, setServiceToDelete] = useState<{ customerType: CustomerType; serviceName: string } | null>(null);
	const customerTypes: CustomerType[] = ['customer', 'garage_service_station', 'dealer'];
	const [newServiceName, setNewServiceName] = useState('');
	const [newServicePrice, setNewServicePrice] = useState('');

	useEffect(() => {
		setLocal(settings);
	}, [settings]);

	useEffect(() => {
		setLocalServices(serviceSets);
	}, [serviceSets]);

	const updateField = (key: keyof typeof local, value: string) => {
		setLocal(prev => ({ ...prev, [key]: value }));
	};

	const updateServicePrice = (customerType: CustomerType, serviceName: string, price: string) => {
		const priceNum = parseFloat(price) || 0;
		setLocalServices(prev => ({
			...prev,
			[customerType]: prev[customerType].map(s => 
				s.name === serviceName ? { ...s, price: priceNum } : s
			)
		}));
	};

	const promptDeleteService = (customerType: CustomerType, serviceName: string) => {
		setServiceToDelete({ customerType, serviceName });
	};

	const handleConfirmDeleteService = () => {
		if (!serviceToDelete) return;
		const { customerType, serviceName } = serviceToDelete;
		setLocalServices(prev => ({
			...prev,
			[customerType]: prev[customerType].filter(s => s.name !== serviceName)
		}));
		setServiceToDelete(null);
		toast.success(t('service-deleted-success', 'Service removed.'));
	};

	const closeDeleteModal = () => {
		setServiceToDelete(null);
	};

	const addNewService = () => {
		if (!newServiceName.trim() || !newServicePrice.trim()) {
			toast.error(t('valid-service-name-price'));
			return;
		}
		const priceNum = parseFloat(newServicePrice);
		if (isNaN(priceNum) || priceNum <= 0) {
			toast.error(t('valid-service-name-price'));
			return;
		}
		setLocalServices(prev => ({
			...prev,
			[selectedCustomerType]: [
				...prev[selectedCustomerType],
				{ name: newServiceName.trim(), price: priceNum, quantity: 1 }
			]
		}));
		setNewServiceName('');
		setNewServicePrice('');
		toast.success(t('service-added-success', 'Service added successfully!'));
	};

	const persist = async () => {
		setSaving(true);
		try {
			// Remove _id before sending to avoid conflicts
			const { _id, ...settingsToSave } = local as any;
			const normalizedSettings = {
				...settingsToSave,
				dailyRevenueTarget: parseNumeric(settingsToSave.dailyRevenueTarget),
				weeklyRevenueTarget: parseNumeric(settingsToSave.weeklyRevenueTarget),
				monthlyRevenueTarget: parseNumeric(settingsToSave.monthlyRevenueTarget),
			};
			const normalizedServiceSets: ServiceSets = {
				customer: localServices.customer.map(s => ({ ...s, price: Number(s.price) || 0 })),
				garage_service_station: localServices.garage_service_station.map(s => ({ ...s, price: Number(s.price) || 0 })),
				dealer: localServices.dealer.map(s => ({ ...s, price: Number(s.price) || 0 })),
			};
			await Promise.all([
				saveSettings(normalizedSettings),
				saveServiceSets(normalizedServiceSets)
			]);
			toast.success(t('settings-saved-success', 'Settings saved successfully.'));
		} catch (e) {
			toast.error(t('settings-saved-error', 'Failed to save settings.'));
			console.error('Save settings failed', e);
		} finally {
			setSaving(false);
		}
	};

	return (
		<>
			<ScrollView
				style={[styles.container, { paddingTop: insets.top }]}
				contentContainerStyle={{ paddingBottom: spacing.xl, backgroundColor: colors.background }}
			>
				<Text style={styles.title} numberOfLines={2}>{t('page-title-settings')}</Text>

				<Text style={styles.sectionTitle}>{t('language', 'Language')}</Text>
				<View style={styles.row}>
					<TouchableOpacity onPress={() => setLanguage('en')} style={[styles.chip, language === 'en' && styles.chipActive]}>
						<Text style={[styles.chipText, language === 'en' && styles.chipTextActive]}>{t('english')}</Text>
					</TouchableOpacity>
					<TouchableOpacity onPress={() => setLanguage('kn')} style={[styles.chip, language === 'kn' && styles.chipActive]}>
						<Text style={[styles.chipText, language === 'kn' && styles.chipTextActive]}>{t('kannada')}</Text>
					</TouchableOpacity>
				</View>

				{/* Invoice language is independent of app language and persisted in settings */}
				<Text style={styles.sectionTitle}>{t('invoice-language', 'Invoice Language')}</Text>
				<View style={styles.row}>
					<TouchableOpacity onPress={() => updateField('invoiceLanguage', 'en')} style={[styles.chip, (local as any)?.invoiceLanguage === 'en' && styles.chipActive]}>
						<Text style={[styles.chipText, (local as any)?.invoiceLanguage === 'en' && styles.chipTextActive]}>{t('english')}</Text>
					</TouchableOpacity>
					<TouchableOpacity onPress={() => updateField('invoiceLanguage', 'kn')} style={[styles.chip, (local as any)?.invoiceLanguage === 'kn' && styles.chipActive]}>
						<Text style={[styles.chipText, (local as any)?.invoiceLanguage === 'kn' && styles.chipTextActive]}>{t('kannada')}</Text>
					</TouchableOpacity>
				</View>

				<View style={styles.sectionDivider} />
				<Text style={styles.sectionTitle}>{t('company-settings', 'Company Settings')}</Text>

				<View style={styles.formGroup}>
					<Text style={styles.label}>{t('company-address', 'Address')}</Text>
					<TextInput
						value={local.companyAddress}
						multiline
						onChangeText={(v) => updateField('companyAddress', v)}
						style={[styles.input, styles.textArea]}
						placeholder="Uttarahalli, Bengaluru - 61"
						autoCapitalize="words"
					/>
				</View>

				<View style={styles.rowHalf}>
					<View style={[styles.formGroup, styles.flexHalf]}>
						<Text style={styles.label}>{t('company-phone', 'Phone')}</Text>
						<TextInput
							value={local.companyPhone}
							onChangeText={(v) => updateField('companyPhone', v)}
							style={styles.input}
							keyboardType="phone-pad"
							placeholder="+91 98XXX XXXXX"
						/>
					</View>
					<View style={[styles.formGroup, styles.flexHalf]}>
						<Text style={styles.label}>{t('company-email', 'Email')}</Text>
						<TextInput
							value={local.companyEmail}
							onChangeText={(v) => updateField('companyEmail', v)}
							style={styles.input}
							keyboardType="email-address"
							autoCapitalize="none"
							placeholder="voswash@gmail.com"
						/>
					</View>
				</View>

				<View style={styles.rowHalf}>
					<View style={[styles.formGroup, styles.flexHalf]}>
						<Text style={styles.label}>{t('gst-number', 'GST Number (Optional)')}</Text>
						<TextInput
							value={local.gstNumber}
							onChangeText={(v) => updateField('gstNumber', v)}
							style={styles.input}
							autoCapitalize="characters"
							placeholder="29ABCDE1234F1Z5"
						/>
					</View>
					<View style={[styles.formGroup, styles.flexHalf]}>
						<Text style={styles.label}>{t('upi-id', 'UPI ID')}</Text>
						<TextInput
							value={local.upiId}
							onChangeText={(v) => updateField('upiId', v)}
							style={styles.input}
							autoCapitalize="none"
							placeholder="yourname@upi"
						/>
					</View>
				</View>

				<View style={styles.sectionDivider} />
				<Text style={styles.sectionTitle}>{t('financial-targets', 'Financial Targets')}</Text>

				<View style={styles.formGroup}>
					<Text style={styles.label}>{t('daily-target', 'Daily Revenue Target (₹)')}</Text>
					<TextInput
						value={local.dailyRevenueTarget ? String(local.dailyRevenueTarget) : ''}
						onChangeText={(v) => updateField('dailyRevenueTarget', v)}
						style={styles.input}
						keyboardType="numeric"
						placeholder="e.g., 5000"
					/>
				</View>

				<View style={styles.rowHalf}>
					<View style={[styles.formGroup, styles.flexHalf]}>
						<Text style={styles.label}>{t('weekly-target', 'Weekly Target (₹)')}</Text>
						<TextInput
							value={local.weeklyRevenueTarget ? String(local.weeklyRevenueTarget) : ''}
							onChangeText={(v) => updateField('weeklyRevenueTarget', v)}
							style={styles.input}
							keyboardType="numeric"
							placeholder="e.g., 35000"
						/>
					</View>
					<View style={[styles.formGroup, styles.flexHalf]}>
						<Text style={styles.label}>{t('monthly-target', 'Monthly Target (₹)')}</Text>
						<TextInput
							value={local.monthlyRevenueTarget ? String(local.monthlyRevenueTarget) : ''}
							onChangeText={(v) => updateField('monthlyRevenueTarget', v)}
							style={styles.input}
							keyboardType="numeric"
							placeholder="e.g., 150000"
						/>
					</View>
				</View>

				<View style={styles.sectionDivider} />
				<Text style={styles.sectionTitle}>{t('service-prices', 'Goods & Service Prices')}</Text>
				<View style={styles.customerTypeSelector}>
					{customerTypes.map(type => (
						<TouchableOpacity
							key={type}
							onPress={() => setSelectedCustomerType(type)}
							style={[styles.typeChip, selectedCustomerType === type && styles.typeChipActive]}
						>
							<Text style={[styles.typeChipText, selectedCustomerType === type && styles.typeChipTextActive]}>
								{t(type)}
							</Text>
						</TouchableOpacity>
					))}
				</View>

				<View style={styles.servicesContainer}>
					{localServices[selectedCustomerType]?.map((service, idx) => (
						<View key={idx} style={styles.serviceRow}>
							<View style={styles.serviceInfo}>
								<Text style={styles.serviceName}>{t(service.name)}</Text>
								<View style={styles.servicePriceInput}>
									<Text style={styles.rupeeSymbol}>₹</Text>
									<TextInput
										value={service.price.toString()}
										onChangeText={(v) => updateServicePrice(selectedCustomerType, service.name, v)}
										style={styles.priceInput}
										keyboardType="numeric"
									/>
								</View>
							</View>
							<TouchableOpacity
								onPress={() => promptDeleteService(selectedCustomerType, service.name)}
								style={styles.deleteServiceBtn}
							>
								<MaterialIcons name="delete-outline" size={20} color={colors.error} />
							</TouchableOpacity>
						</View>
					))}
				</View>

				<View style={styles.addServiceSection}>
					<Text style={styles.addServiceTitle}>
						{t('add-service-for', 'Add Goods/Service for {customerType}').replace('{customerType}', t(selectedCustomerType))}
					</Text>
					<View style={styles.addServiceRow}>
						<TextInput
							value={newServiceName}
							onChangeText={setNewServiceName}
							style={[styles.input, styles.serviceNameInput]}
							placeholder={t('service-name-placeholder')}
							autoCapitalize="words"
						/>
						<TextInput
							value={newServicePrice}
							onChangeText={setNewServicePrice}
							style={[styles.input, styles.servicePriceInputField]}
							placeholder={t('price-placeholder', 'Price (₹)')}
							keyboardType="numeric"
						/>
						<TouchableOpacity onPress={addNewService} style={styles.addServiceBtn}>
							<MaterialIcons name="add-circle" size={32} color={colors.primary} />
						</TouchableOpacity>
					</View>
				</View>

				<TouchableOpacity disabled={saving} style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={persist}>
					<Text style={styles.saveBtnText}>{saving ? t('saving', 'Saving...') : t('save-settings', 'Save Settings')}</Text>
				</TouchableOpacity>
			</ScrollView>
			{serviceToDelete ? (
				<Modal
					visible
					onClose={closeDeleteModal}
					title={t('confirm-delete-service', 'Delete this service?')}
				>
					<Text style={{ marginBottom: spacing.md }}>
						{t(serviceToDelete.serviceName, serviceToDelete.serviceName)}
					</Text>
					<View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm }}>
						<Button variant="secondary" onPress={closeDeleteModal}>{t('cancel', 'Cancel')}</Button>
						<Button variant="danger" onPress={handleConfirmDeleteService}>{t('delete', 'Delete')}</Button>
					</View>
				</Modal>
			) : null}
		</>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, padding: spacing.md, backgroundColor: colors.background },
	title: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
	sectionTitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm, fontWeight: '600' },
	row: { flexDirection: 'row', gap: spacing.sm },
	chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingVertical: 8, paddingHorizontal: 14, backgroundColor: colors.white },
	chipActive: { backgroundColor: colors.primary },
	chipText: { ...typography.caption, color: colors.textSecondary },
	chipTextActive: { color: colors.white, fontWeight: '600' },
	sectionDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
	formGroup: { marginBottom: spacing.md },
	label: { ...typography.caption, color: colors.textSecondary, marginBottom: 4, fontWeight: '500' },
	input: { borderWidth:1, borderColor: colors.border, borderRadius:8, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.white, color: colors.text },
	textArea: { minHeight: 80, textAlignVertical: 'top' },
	rowHalf: { flexDirection:'row', gap: spacing.md },
	flexHalf: { flex:1 },
	customerTypeSelector: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md, flexWrap: 'wrap' },
	typeChip: { borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingVertical: 10, paddingHorizontal: 16, backgroundColor: colors.white },
	typeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
	typeChipText: { ...typography.body, color: colors.textSecondary, fontWeight: '500' },
	typeChipTextActive: { color: colors.white, fontWeight: '600' },
	servicesContainer: { marginBottom: spacing.md },
	serviceRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 8, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
	serviceInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
	serviceName: { ...typography.body, color: colors.text, fontWeight: '500', flex: 1 },
	servicePriceInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 6, paddingHorizontal: spacing.sm },
	rupeeSymbol: { ...typography.body, color: colors.textSecondary, marginRight: 4 },
	priceInput: { ...typography.body, color: colors.text, paddingVertical: spacing.xs, width: 80, textAlign: 'right' },
	deleteServiceBtn: { marginLeft: spacing.sm, padding: spacing.xs },
	addServiceSection: { backgroundColor: colors.surface, borderRadius: 8, padding: spacing.md, marginBottom: spacing.md },
	addServiceTitle: { ...typography.body, color: colors.text, fontWeight: '600', marginBottom: spacing.sm },
	addServiceRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
	serviceNameInput: { flex: 2 },
	servicePriceInputField: { flex: 1 },
	addServiceBtn: { padding: spacing.xs },
	saveBtn: { backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius:10, alignItems:'center', marginTop: spacing.md },
	saveBtnText: { ...typography.body, color: colors.white, fontWeight:'600' },
});
