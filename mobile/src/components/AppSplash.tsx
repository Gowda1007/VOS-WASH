import React from 'react';
import { View, Image, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { colors, spacing, typography } from '../styles/theme';
import { useLanguage } from '../context/LanguageContext';

const AppSplash: React.FC = () => {
	const { t } = useLanguage();
	return (
			<View style={styles.container}>
				{/* Top banner */}
				<Image source={require('../../assets/sri-vari.png')} style={styles.banner} resizeMode="contain" />

			{/* Logo + App info */}
			<View style={styles.brandRow}>
				<Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
				<View style={styles.companyInfo}>
					<Text style={styles.title}>{(t('app-name') || 'VOS WASH').toUpperCase()}</Text>
					<Text style={styles.tagline}>({t('app-tagline') || 'Clean Everything'})</Text>
				</View>
			</View>
			<ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.lg }} />
			</View>
	);
};

export default AppSplash;

const styles = StyleSheet.create({
		container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, padding: spacing.xl },
		banner: { width: 220, height: 60, marginBottom: spacing.lg },
	brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
	companyInfo: { alignItems: 'stretch', justifyContent: 'center', minWidth: 120 },
	logo: { width: 96, height: 96 },
	title: { ...typography.h2, color: colors.primary, letterSpacing: 1, marginBottom: 2, textAlign: 'left', fontSize: 36 },
	tagline: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'right', fontSize: 16, fontWeight: '600' },
});
