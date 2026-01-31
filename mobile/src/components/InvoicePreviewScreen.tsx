import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { UnifiedInvoicePreview } from './UnifiedInvoicePreview';
import { useLanguage } from '../context/LanguageContext';
import { getPdfAdapter, getShareAdapter, getNotificationAdapter } from '../services';
import { colors, spacing, typography } from '../styles/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { calculateRemainingBalance } from '../core/utils/invoiceUtils';
import type { Invoice, Language } from '../core/types';

interface Props {
	invoice: Invoice;
	company: {
		name: string;
		tagline: string;
		address: string;
		phone: string;
		email: string;
		gstNumber: string;
	};
	onClose: () => void;
	onCollectPayment?: () => void;
}

export const InvoicePreviewScreen: React.FC<Props> = ({ invoice, company, onClose, onCollectPayment }) => {
	const { t, language } = useLanguage();
	const [loading, setLoading] = useState(false);
	const insets = useSafeAreaInsets();
	// Default to 'en' unless explicitly set to 'kn' in invoice or user toggles
	const [previewLanguage, setPreviewLanguage] = useState<Language>(invoice.language || 'en');

	const balanceDue = calculateRemainingBalance(invoice);
	const hasBalance = balanceDue > 0;

	const handleCall = async () => {
		try {
			const cleanedPhone = invoice.customerPhone.replace(/[^\d+]/g, '');
			const phoneUrl = `tel:${cleanedPhone}`;
			await Linking.openURL(phoneUrl);
		} catch (error) {
			console.error('Call failed:', error);
			const notificationAdapter = getNotificationAdapter();
			notificationAdapter.showNotification?.({
				title: t('error', 'Error'),
				body: t('call-failed', 'Failed to initiate call'),
			});
		}
	};

	const handleDownload = async () => {
		setLoading(true);
		try {
			const pdfAdapter = getPdfAdapter();
			// Create a modified invoice with the selected preview language
			const invoiceWithLanguage = { ...invoice, language: previewLanguage };
			const result = await pdfAdapter.generateInvoicePdf({
				invoice: invoiceWithLanguage,
				companyName: company.name,
				companyTagline: company.tagline,
				companyAddress: company.address,
				companyPhone: company.phone,
				companyEmail: company.email,
				gstNumber: company.gstNumber,
			});
			
			if (result.success && result.filePath) {
				await pdfAdapter.openPdf?.(result.filePath);
				const notificationAdapter = getNotificationAdapter();
				notificationAdapter.showNotification?.({
					title: t('invoice-downloaded', 'Invoice Downloaded'),
					body: t('invoice-saved-successfully', 'Invoice saved successfully'),
				});
			}
		} catch (error) {
			console.error('Download failed:', error);
			const notificationAdapter = getNotificationAdapter();
			notificationAdapter.showNotification?.({
				title: t('error', 'Error'),
				body: t('download-failed', 'Failed to download invoice'),
			});
		} finally {
			setLoading(false);
		}
	};

	const handleShare = async () => {
		setLoading(true);
		try {
			const pdfAdapter = getPdfAdapter();
			// Create a modified invoice with the selected preview language
			const invoiceWithLanguage = { ...invoice, language: previewLanguage };
			const result = await pdfAdapter.generateInvoicePdfForSharing({
				invoice: invoiceWithLanguage,
				companyName: company.name,
				companyTagline: company.tagline,
				companyAddress: company.address,
				companyPhone: company.phone,
				companyEmail: company.email,
				gstNumber: company.gstNumber,
			});
			
			if (result.success && result.filePath) {
				const shareAdapter = getShareAdapter();
				await shareAdapter.share({
					filePath: result.filePath,
					title: t('share-invoice', 'Share Invoice'),
					message: `${t('invoice', 'Invoice')} #${invoice.invoiceNumber}`,
					type: 'application/pdf',
				});
			}
		} catch (error) {
			console.error('Share failed:', error);
			const notificationAdapter = getNotificationAdapter();
			notificationAdapter.showNotification?.({
				title: t('error', 'Error'),
				body: t('share-failed', 'Failed to share invoice'),
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<View style={styles.container}>
			{/* Header */}
			<View style={[styles.header, { paddingTop: insets.top }]}>
				<TouchableOpacity onPress={onClose} style={styles.closeButton}>
					<MaterialIcons name="close" size={24} color={colors.text} />
				</TouchableOpacity>
				<Text style={styles.title}>{t('invoice-preview-title', 'Invoice Preview')}</Text>
				<View style={styles.headerActions}>
					{/* Language Toggle */}
					<TouchableOpacity 
						onPress={() => setPreviewLanguage(previewLanguage === 'en' ? 'kn' : 'en')} 
						style={[styles.actionButton, styles.languageButton]}
						disabled={loading}
					>
						<Text style={styles.languageText}>{previewLanguage === 'en' ? 'EN' : 'ಕನ್ನಡ'}</Text>
					</TouchableOpacity>
					<TouchableOpacity 
						onPress={handleDownload} 
						style={styles.actionButton}
						disabled={loading}
					>
						{loading ? (
							<ActivityIndicator size="small" color={colors.primary} />
						) : (
							<MaterialIcons name="download" size={24} color={colors.primary} />
						)}
					</TouchableOpacity>
					<TouchableOpacity 
						onPress={handleShare} 
						style={styles.actionButton}
						disabled={loading}
					>
						<MaterialIcons name="share" size={24} color={colors.primary} />
					</TouchableOpacity>
				</View>
			</View>

			{/* Preview Content */}
			<ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
				<UnifiedInvoicePreview
					invoiceData={invoice}
					language={previewLanguage}
					company={company}
				/>
			</ScrollView>

			{/* Action Bar */}
			<View style={styles.actionBar}>
				<TouchableOpacity 
					onPress={handleCall} 
					style={[styles.actionBarButton, styles.callButton]}
				>
					<MaterialIcons name="phone" size={20} color={colors.white} />
					<Text style={styles.actionBarButtonText}>{t('call', 'Call')}</Text>
				</TouchableOpacity>
				{hasBalance && onCollectPayment && (
					<TouchableOpacity 
						onPress={onCollectPayment} 
						style={[styles.actionBarButton, styles.collectButton]}
					>
						<MaterialIcons name="payment" size={20} color={colors.white} />
						<Text style={styles.actionBarButtonText}>{t('collect-payment', 'Collect Payment')}</Text>
					</TouchableOpacity>
				)}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: spacing.md,
		paddingBottom: spacing.md,
		backgroundColor: colors.white,
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
		elevation: 2,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
	},
	closeButton: {
		padding: spacing.xs,
	},
	title: {
		...typography.h4,
		color: colors.text,
		flex: 1,
		textAlign: 'center',
	},
	headerActions: {
		flexDirection: 'row',
		gap: spacing.sm,
	},
	actionButton: {
		padding: spacing.xs,
	},
	languageButton: {
		backgroundColor: colors.primary,
		borderRadius: 6,
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.xs,
		minWidth: 50,
		alignItems: 'center',
		justifyContent: 'center',
	},
	languageText: {
		...typography.caption,
		color: colors.white,
		fontWeight: '600',
		fontSize: 12,
	},
	content: {
		flex: 1,
	},
	contentContainer: {
		padding: spacing.md,
		paddingBottom: spacing.xxl,
	},
	actionBar: {
		flexDirection: 'row',
		gap: spacing.md,
		padding: spacing.md,
		backgroundColor: colors.white,
		borderTopWidth: 1,
		borderTopColor: colors.border,
		elevation: 4,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: -2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
	},
	actionBarButton: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: spacing.xs,
		paddingVertical: spacing.md,
		borderRadius: 8,
	},
	callButton: {
		backgroundColor: colors.success,
	},
	collectButton: {
		backgroundColor: colors.primary,
	},
	actionBarButtonText: {
		...typography.body,
		color: colors.white,
		fontWeight: '600',
	},
});
