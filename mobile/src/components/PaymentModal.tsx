import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Modal, Button } from './Common';
import { useLanguage } from '../context/LanguageContext';
import { useAppSettings } from '../hooks/useAppSettings';
import type { Invoice, PaymentMethod } from '../core/types';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { apiService } from '../services';
import { calculateRemainingBalance } from '../core/utils/invoiceUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

interface PaymentModalProps {
  visible: boolean;
  invoice: Invoice | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ visible, invoice, onClose, onSuccess }) => {
  const { t } = useLanguage();
  const { settings: appSettings } = useAppSettings();
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [showQr, setShowQr] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showReferencePopup, setShowReferencePopup] = useState(false);
  const [tempReference, setTempReference] = useState('');
  

  // Reset state when modal opens with new invoice
  useEffect(() => {
    if (visible && invoice) {
      const balance = calculateRemainingBalance(invoice);
      setAmount(balance > 0 ? balance.toString() : '');
      setMethod('cash');
      setShowQr(false);
      setLoading(false);
      setShowReferencePopup(false);
      setTempReference('');
    }
  }, [visible, invoice]);

  if (!invoice) return null;

  const generateQr = () => {
    const value = parseFloat(amount || '0');
    if (!value || value <= 0) return;
    setShowQr(true);
  };

  const getUpiString = () => {
    const value = parseFloat(amount || '0');
    const upiId = appSettings.upiId || 'voswash@bank';
    const companyName = appSettings.companyName || 'VOS WASH';
    return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(companyName)}&am=${value.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Invoice ${invoice.invoiceNumber}`)}`;
  };

  const recordPayment = async () => {
    const value = parseFloat(amount || '0');
    if (!value || value <= 0) {
      Alert.alert(t('error', 'Error'), t('invalid-amount', 'Please enter a valid amount'));
      return;
    }
    // If UPI, prompt for optional reference number via popup
    if (method === 'upi') {
      setTempReference('');
      setShowReferencePopup(true);
      return;
    }
    // Cash proceeds directly without reference
    await savePayment('');
  };

  const savePayment = async (ref: string) => {
    const value = parseFloat(amount || '0');
    setLoading(true);
    try {
      await apiService.recordInvoicePayment(invoice.invoiceNumber, value, method, ref || undefined);
      // Reset state
      setAmount('');
      setMethod('cash');
      setShowQr(false);
      setShowReferencePopup(false);
      setTempReference('');
      // Call success callback and close
      onSuccess?.();
      onClose();
    } catch (e) {
      console.error('Payment failed', e);
      Alert.alert(t('error', 'Error'), t('payment-failed', 'Failed to record payment. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Modal visible={visible} onClose={onClose} title="" fullScreen>
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('collect-balance-title','Collect Balance')}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Content */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={styles.row}>
            <Text style={styles.label}>{t('enter-amount','Enter Amount (₹):')}</Text>
            <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.textLight} />
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t('payment-method','Payment Method:')}</Text>
            <View style={styles.methodRow}>
              <TouchableOpacity style={[styles.chip, method==='cash'&&styles.chipActive]} onPress={()=>setMethod('cash')}>
                <Text style={[styles.chipText, method==='cash'&&styles.chipTextActive]}>{t('cash','Cash')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.chip, method==='upi'&&styles.chipActive]} onPress={()=>setMethod('upi')}>
                <Text style={[styles.chipText, method==='upi'&&styles.chipTextActive]}>{t('upi','UPI')}</Text>
              </TouchableOpacity>
            </View>
          </View>
          {method==='upi' && (
            <View style={{ marginTop: spacing.md }}>
              <Button variant="secondary" onPress={generateQr}>{t('scan-to-pay','Scan to pay ₹{amount}').replace('{amount}', amount || '0')}</Button>
              {showQr && (
                <View style={{ alignItems: 'center', marginTop: spacing.md, padding: spacing.md, backgroundColor: colors.white, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
                  <QRCode
                    value={getUpiString()}
                    size={200}
                    backgroundColor={colors.white}
                    color={colors.text}
                  />
                  <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' }}>
                    {t('scan-qr-instruction', 'Scan QR code with any UPI app')}
                  </Text>
                </View>
              )}
            </View>
          )}
          <View style={{ marginTop: spacing.lg }}>
            <Button variant="primary" onPress={recordPayment} loading={loading}>{t('confirm-collection','Confirm Collection')}</Button>
          </View>
        </ScrollView>
      </View>
    </Modal>

    {/* UPI Reference Popup */}
    <Modal
      visible={showReferencePopup}
      onClose={() => setShowReferencePopup(false)}
      title={t('upi-reference', 'UPI Reference (Optional)')}
      footer={
        <>
          <Button
            variant="secondary"
            onPress={() => {
              setShowReferencePopup(false);
              savePayment('');
            }}
          >
            {t('skip', 'Skip')}
          </Button>
          <Button
            variant="primary"
            onPress={() => {
              setShowReferencePopup(false);
              savePayment(tempReference);
            }}
            loading={loading}
          >
            {t('save-and-continue', 'Save & Continue')}
          </Button>
        </>
      }
    >
      <View style={styles.row}>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  row: { marginBottom: spacing.md },
  label: { ...typography.bodySmall, color: colors.text, marginBottom: spacing.xs },
  input: { borderWidth:1, borderColor: colors.border, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: 10, color: colors.text, backgroundColor: colors.white },
  methodRow: { flexDirection:'row', gap: spacing.sm },
  chip: { borderWidth:1, borderColor: colors.border, borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: colors.white },
  chipActive: { backgroundColor: colors.primary },
  chipText: { ...typography.caption, color: colors.textSecondary },
  chipTextActive: { color: colors.white, fontWeight: '600' },
});
