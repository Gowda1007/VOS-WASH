import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { colors, spacing, typography } from '../styles/theme';
import { useLanguage } from '../context/LanguageContext';
import { useAppSettings } from '../hooks/useAppSettings';
import type { Invoice, PaymentMethod, Language } from '../core/types';
import { calculateRemainingBalance } from '../core/utils/invoiceUtils';
import { UnifiedInvoicePreview } from './UnifiedInvoicePreview';
import { Modal, Button } from './Common';

interface Props {
  savedInvoice: Invoice;
  appSettings: { 
    upiId?: string;
    companyName?: string;
    companyTagline?: string;
    companyAddress?: string;
    companyPhone?: string;
    companyEmail?: string;
    gstNumber?: string;
  };
  onCollectPayment: (amount: number, method: PaymentMethod, referenceNumber?: string) => Promise<void>;
  onSkipPayment: () => void;
  onDownload: () => Promise<void>;
  onShareWhatsApp: () => Promise<void>;
  onGoHome: () => void; // New prop for Home navigation
  isProcessing: boolean; // For payment collection
  isDownloading: boolean; // For PDF download
  isSharing: boolean; // For WhatsApp share
  paymentCollected: boolean;
}

const paymentMethods: PaymentMethod[] = ['cash', 'upi'];

const formatAmount = (num: number): string => {
  if (Math.abs(num) >= 100000) {
    return Math.round(num).toLocaleString('en-IN');
  }
  return num.toFixed(2);
};

export const PaymentCollectionStep: React.FC<Props> = ({
  savedInvoice,
  appSettings,
  onCollectPayment,
  onSkipPayment,
  onDownload,
  onShareWhatsApp,
  onGoHome,
  isProcessing,
  isDownloading,
  isSharing,
  paymentCollected,
}) => {
  const { t } = useLanguage();
  const { settings: appSettingsHook } = useAppSettings();
  const balanceDue = calculateRemainingBalance(savedInvoice);
  const [amount, setAmount] = useState<string>(formatAmount(Math.max(0, balanceDue)));
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [invoiceLanguage, setInvoiceLanguage] = useState<Language>(savedInvoice.language || appSettingsHook.invoiceLanguage || 'en');

  // Update default amount when balance changes (e.g., partial payments)
  useEffect(() => {
    setAmount(formatAmount(Math.max(0, balanceDue)));
  }, [balanceDue]);

  const [showReferencePopup, setShowReferencePopup] = useState(false);
  const [tempReference, setTempReference] = useState('');

  const handleCollect = async () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) return;
    if (method === 'upi') {
      setTempReference('');
      setShowReferencePopup(true);
      return;
    }
    await onCollectPayment(amountNum, method);
  };

  const savePaymentWithRef = async (ref?: string) => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) return;
    await onCollectPayment(amountNum, method, ref || undefined);
    setShowReferencePopup(false);
    setTempReference('');
  };

  const generateQrCodeUrl = () => {
    if (!appSettings.upiId || !amount) return null;
    const amountNum = parseFloat(amount);
    if (amountNum <= 0) return null;
    const payeeName = 'VOS WASH';
    return `upi://pay?pa=${appSettings.upiId}&pn=${encodeURIComponent(
      payeeName
    )}&am=${amountNum}&cu=INR`;
  };

  const qrCodeUrl = generateQrCodeUrl();

  if (paymentCollected) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.successBanner}>
          <MaterialIcons name="check-circle" size={24} color={colors.success} />
          <Text style={styles.successMessage}>{t('payment-recorded-successfully')}</Text>
        </View>

        <UnifiedInvoicePreview
          invoiceData={savedInvoice}
          language={invoiceLanguage}
          company={{
            name: appSettings.companyName || 'VOS WASH',
            tagline: appSettings.companyTagline,
            address: 'Uttarahalli, Bengaluru - 61',
            phone: appSettings.companyPhone || '',
            email: appSettings.companyEmail,
            gstNumber: appSettings.gstNumber,
          }}
        />

        <View style={styles.actionButtonsRow}>
          <TouchableOpacity style={styles.homeButtonAlt} onPress={onGoHome} disabled={isDownloading || isSharing}>
            <MaterialIcons name="home" size={20} color={colors.white} />
            <Text style={styles.buttonText}>{t('home', 'Home')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.downloadButton} onPress={onDownload} disabled={isDownloading || isSharing}>
            {isDownloading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <>
                <MaterialIcons name="download" size={20} color={colors.white} />
                <Text style={styles.buttonText}>{t('download', 'Download')}</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.whatsappButton} onPress={onShareWhatsApp} disabled={isSharing || isDownloading}>
            {isSharing ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <>
                <MaterialIcons name="share" size={20} color={colors.white} />
                <Text style={styles.buttonText}>{t('share', 'Share')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <>
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{t('collect-payment')}</Text>

        <View style={styles.balanceSection}>
          <Text style={styles.invoiceNumber}>
            {t('invoice-number', 'Invoice #')}{savedInvoice.invoiceNumber || 'N/A'}
          </Text>
          <Text style={styles.balanceLabel}>
            {savedInvoice.customerName || 'N/A'}
          </Text>
          <Text style={styles.balanceAmount}>
            {t('balance-due-label', 'Balance Due')} ₹{formatAmount(Math.max(0, balanceDue))}
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('enter-amount')}</Text>
          <TextInput
            style={styles.input}
            placeholder={formatAmount(Math.max(0, balanceDue))}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('payment-method')}</Text>
          <View style={styles.radioGroup}>
            {paymentMethods.map((pm) => (
              <TouchableOpacity key={pm} style={styles.radioItem} onPress={() => setMethod(pm)}>
                <MaterialIcons
                  name={method === pm ? 'radio-button-checked' : 'radio-button-unchecked'}
                  size={20}
                  color={method === pm ? colors.primary : colors.textSecondary}
                />
                <Text style={styles.radioLabel}>{t(pm)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {method === 'upi' && qrCodeUrl && (
          <View style={styles.qrSection}>
            <Text style={styles.qrLabel}>
              {t('scan-to-pay', 'Scan to pay ₹{amount}').replace('{amount}', amount)}
            </Text>
            <QRCode value={qrCodeUrl} size={200} />
            {appSettings.upiId && <Text style={styles.upiId}>{appSettings.upiId}</Text>}
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.homeButton} onPress={onGoHome} disabled={isProcessing}>
            <MaterialIcons name="home" size={20} color={colors.white} />
            <Text style={styles.buttonText}>{t('go-home', 'Go Home')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipButton} onPress={onSkipPayment} disabled={isProcessing}>
            <MaterialIcons name="skip-next" size={20} color={colors.white} />
            <Text style={styles.buttonText}>{t('skip', 'Skip')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.collectButton}
            onPress={handleCollect}
            disabled={isProcessing}
          >
            <MaterialIcons name="payment" size={20} color={colors.white} />
            <Text style={styles.buttonText}>
              {isProcessing ? t('processing') : t('collect', 'Collect')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
    
    {/* UPI Reference Popup */}
    <Modal
      visible={showReferencePopup}
      onClose={() => setShowReferencePopup(false)}
      title={t('upi-reference', 'UPI Reference (Optional)')}
      footer={
        <>
          <Button
            variant="secondary"
            onPress={() => savePaymentWithRef('')}
            disabled={isProcessing}
          >
            {t('skip', 'Skip')}
          </Button>
          <Button
            variant="primary"
            onPress={() => savePaymentWithRef(tempReference)}
            loading={isProcessing}
          >
            {t('save-and-continue', 'Save & Continue')}
          </Button>
        </>
      }
    >
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('reference-number', 'Reference Number')}</Text>
        <TextInput
          style={styles.input}
          value={tempReference}
          onChangeText={setTempReference}
          placeholder={t('optional', 'Optional')}
          placeholderTextColor={colors.textLight}
          autoFocus
        />
      </View>
    </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.success,
  },
  title: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
  balanceSection: { alignItems: 'center', marginBottom: spacing.lg },
  invoiceNumber: { ...typography.h3, color: colors.primary, fontWeight: 'bold', marginBottom: spacing.xs },
  balanceLabel: { ...typography.body, color: colors.textSecondary },
  balanceAmount: { ...typography.h2, color: colors.primary, fontWeight: 'bold', marginTop: spacing.xs },
  inputGroup: { marginBottom: spacing.md },
  label: { ...typography.bodySmall, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    color: colors.text,
    backgroundColor: colors.white,
    ...typography.body,
  },
  radioGroup: { flexDirection: 'row', gap: spacing.md },
  radioItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  radioLabel: { ...typography.body, color: colors.text },
  qrSection: {
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginVertical: spacing.md,
  },
  qrLabel: { ...typography.body, color: colors.text, marginBottom: spacing.md },
  upiId: { ...typography.body, color: colors.text, fontWeight: '600', marginTop: spacing.md },
  buttonContainer: { 
    flexDirection: 'row', 
    gap: spacing.sm, 
    marginTop: spacing.lg,
  },
  homeButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.md,
    minHeight: 48,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  skipButton: {
    flex: 1,
    backgroundColor: colors.warning,
    borderRadius: 8,
    paddingVertical: spacing.md,
    minHeight: 48,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  collectButton: {
    flex: 1,
    backgroundColor: colors.success,
    borderRadius: 8,
    paddingVertical: spacing.md,
    minHeight: 48,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  actionButtonsRow: { 
    flexDirection: 'row',
    gap: spacing.sm, 
    marginTop: spacing.md, 
    paddingHorizontal: spacing.md, 
    paddingBottom: spacing.lg,
  },
  homeButtonAlt: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.md,
    minHeight: 48,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  downloadButton: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    paddingVertical: spacing.md,
    minHeight: 48,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  whatsappButton: {
    flex: 1,
    backgroundColor: '#25D366',
    borderRadius: 8,
    paddingVertical: spacing.md,
    minHeight: 48,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: { 
    ...typography.bodySmall, 
    color: colors.white, 
    fontWeight: '600',
    fontSize: 13,
  },
  successMessage: {
    ...typography.body,
    color: colors.success,
    fontWeight: '600',
  },
});

export default PaymentCollectionStep;
