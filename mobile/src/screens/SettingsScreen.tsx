import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { colors, spacing, typography } from '../styles/theme';

export const SettingsScreen: React.FC = () => {
	const { language, setLanguage, t } = useLanguage();

	return (
		<View style={styles.container}>
			<Text style={styles.title}>{t('page-title-settings')}</Text>

			<Text style={styles.sectionTitle}>{t('language', 'Language')}</Text>
			<View style={styles.row}>
				<TouchableOpacity
					onPress={() => setLanguage('en')}
					style={[styles.chip, language === 'en' && styles.chipActive]}
				>
					<Text style={[styles.chipText, language === 'en' && styles.chipTextActive]}>{t('english')}</Text>
				</TouchableOpacity>
				<TouchableOpacity
					onPress={() => setLanguage('kn')}
					style={[styles.chip, language === 'kn' && styles.chipActive]}
				>
					<Text style={[styles.chipText, language === 'kn' && styles.chipTextActive]}>{t('kannada')}</Text>
				</TouchableOpacity>
			</View>

			<View style={{ height: spacing.lg }} />
			<Text style={styles.note}>{t('settings-coming-soon', 'More settings coming soon...')}</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, padding: spacing.md, backgroundColor: colors.background },
	title: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
	sectionTitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm },
	row: { flexDirection: 'row', gap: spacing.sm },
	chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingVertical: 8, paddingHorizontal: 14, backgroundColor: colors.white },
	chipActive: { backgroundColor: colors.primary },
	chipText: { ...typography.caption, color: colors.textSecondary },
	chipTextActive: { color: colors.white, fontWeight: '600' },
	note: { ...typography.caption, color: colors.textSecondary },
});
