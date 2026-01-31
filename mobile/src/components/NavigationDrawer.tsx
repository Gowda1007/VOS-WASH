import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../styles/theme';
import { useLanguage } from '../context/LanguageContext';

type DrawerItem = {
	name: string;
	label: string;
	icon: keyof typeof MaterialIcons.glyphMap;
};

const drawerItems: DrawerItem[] = [
	{ name: 'Dashboard', label: 'dashboard', icon: 'dashboard' },
	{ name: 'Invoices', label: 'invoices', icon: 'receipt' },
	{ name: 'Orders', label: 'orders', icon: 'list-alt' },
	{ name: 'Customers', label: 'customers', icon: 'people' },
	{ name: 'RawMaterials', label: 'raw-materials', icon: 'local-shipping' },
	{ name: 'Settings', label: 'settings', icon: 'settings' },
];

export const NavigationDrawer: React.FC<DrawerContentComponentProps> = (props) => {
	const { t, language, setLanguage } = useLanguage();
	const { state, navigation } = props;
	const currentRoute = state.routes[state.index].name;

	return (
		<View style={styles.container}>
			<ScrollView style={styles.scrollView}>
				{/* Header with Logo and App Name */}
				<View style={styles.header}>
					<Image 
						source={require('../../assets/sri-vari.png')} 
						style={styles.banner} 
						resizeMode="contain" 
					/>
				<View style={styles.logoContainer}>
					<Image 
						source={require('../../assets/logo.png')} 
						style={styles.logo} 
						resizeMode="contain" 
					/>
					<View style={styles.appInfo}>
						<Text style={styles.appName}>{t('app-name') || 'VOS WASH'}</Text>
						<Text style={styles.appTagline}>({t('app-tagline') || 'Clean Everything'})</Text>
					</View>
				</View>
				</View>

				{/* Navigation Items */}
				<View style={styles.navSection}>
					{drawerItems.map((item) => {
						const isActive = currentRoute === item.name;
						return (
							<TouchableOpacity
								key={item.name}
								style={[styles.navItem, isActive && styles.navItemActive]}
								onPress={() => {
									navigation.navigate(item.name as any);
								}}
							>
								<MaterialIcons 
									name={item.icon} 
									size={24} 
									color={isActive ? colors.white : colors.textSecondary} 
								/>
								<Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
									{t(item.label)}
								</Text>
							</TouchableOpacity>
						);
					})}
				</View>
			</ScrollView>

			{/* Bottom Section: Language Toggle */}
			<View style={styles.footer}>
				<View style={styles.languageToggle}>
					<TouchableOpacity
						style={[styles.langButton, language === 'en' && styles.langButtonActive]}
						onPress={() => setLanguage('en')}
					>
						<Text style={[styles.langText, language === 'en' && styles.langTextActive]}>En</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={[styles.langButton, language === 'kn' && styles.langButtonActive]}
						onPress={() => setLanguage('kn')}
					>
						<Text style={[styles.langText, language === 'kn' && styles.langTextActive]}>ಕ</Text>
					</TouchableOpacity>
				</View>
				
				{/* Action Buttons */}
				<TouchableOpacity
					style={styles.actionButton}
					onPress={() => {
						navigation.closeDrawer();
						navigation.navigate('TakeOrder' as any);
					}}
				>
					<MaterialIcons name="add-shopping-cart" size={20} color={colors.white} />
					<Text style={styles.actionButtonText}>{t('take-order', 'Take Order')}</Text>
				</TouchableOpacity>
				
				<TouchableOpacity
					style={[styles.actionButton, styles.actionButtonPrimary]}
					onPress={() => {
						navigation.closeDrawer();
						navigation.navigate('NewInvoice' as any);
					}}
				>
					<MaterialIcons name="add-circle" size={20} color={colors.white} />
					<Text style={styles.actionButtonText}>{t('new-invoice', 'New Invoice')}</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.white,
	},
	scrollView: {
		flex: 1,
	},
	header: {
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
		paddingVertical: spacing.lg,
		alignItems: 'center',
	},
	banner: {
		width: 140,
		height: 40,
		marginBottom: spacing.sm,
	},
	logoContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: spacing.xs,
	},
	logo: {
		width: 48,
		height: 48,
	},
	appInfo: {
		alignItems: 'stretch',
		justifyContent: 'center',
		minWidth: 100,
	},
	appName: {
		...typography.h3,
		color: colors.primary,
		fontWeight: '700',
		letterSpacing: 0.5,
		textAlign: 'left',
		fontSize: 24,
	},
	appTagline: {
		...typography.caption,
		color: colors.textSecondary,
		marginTop: 2,
		textAlign: 'right',
		fontWeight: '600',
	},
	navSection: {
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.md,
	},
	navItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: spacing.md,
		paddingHorizontal: spacing.md,
		borderRadius: 8,
		marginBottom: spacing.xs,
		gap: spacing.md,
	},
	navItemActive: {
		backgroundColor: colors.primary,
	},
	navLabel: {
		...typography.body,
		color: colors.textSecondary,
	},
	navLabelActive: {
		color: colors.white,
		fontWeight: '600',
	},
	footer: {
		borderTopWidth: 1,
		borderTopColor: colors.border,
		padding: spacing.md,
		gap: spacing.sm,
	},
	languageToggle: {
		flexDirection: 'row',
		backgroundColor: colors.surface,
		borderRadius: 8,
		padding: 4,
		gap: 4,
	},
	langButton: {
		flex: 1,
		paddingVertical: spacing.sm,
		alignItems: 'center',
		borderRadius: 6,
	},
	langButtonActive: {
		backgroundColor: colors.white,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	},
	langText: {
		...typography.body,
		color: colors.textSecondary,
		fontWeight: '600',
	},
	langTextActive: {
		color: colors.text,
	},
	actionButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.success,
		paddingVertical: spacing.md,
		paddingHorizontal: spacing.lg,
		borderRadius: 8,
		gap: spacing.sm,
	},
	actionButtonPrimary: {
		backgroundColor: colors.primary,
	},
	actionButtonText: {
		...typography.body,
		color: colors.white,
		fontWeight: '600',
	},
});
