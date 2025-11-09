import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image } from 'react-native';
import { Modal, Button } from './Common';
import { useLanguage } from '../context/LanguageContext';
import type { Invoice, PaymentMethod } from '../core/types';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { apiService } from '../services';
import { qrAdapter } from '../adapters';

interface PaymentModalProps {
  visible: boolean;
  invoice: Invoice | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ visible, invoice, onClose, onSuccess }) => {
  const { t } = useLanguage();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [reference, setReference] = useState('');
  const [qrUri, setQrUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  if (!invoice) return null;

  const generateQr = async () => {
    const value = parseFloat(amount || '0');
    if (!value || value <= 0) return;
    try {
  const res = await qrAdapter.generateUpiQrCode('upi@bank', value, 'VOS WASH');
  if (res.success) setQrUri(res.svg as string);
    } catch (e) { console.error('QR generation failed', e); }
  };

  const recordPayment = async () => {
    const value = parseFloat(amount || '0');
    if (!value || value <= 0) return;
    setLoading(true);
    try {
      await apiService.recordInvoicePayment(invoice.invoiceNumber, value, method, reference || undefined);
      onSuccess?.();
      onClose();
    } catch (e) { console.error('Payment failed', e); }
    finally { setLoading(false); }
  };

  return (
    <Modal visible={visible} onClose={onClose} title={t('collect-balance-title','Collect Balance')}>
      <View style={styles.row}><Text style={styles.label}>{t('enter-amount','Enter Amount (₹):')}</Text>
        <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.textLight} />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>{t('payment-method','Payment Method:')}</Text>
        <View style={styles.methodRow}>
          <TouchableOpacity style={[styles.chip, method==='cash'&&styles.chipActive]} onPress={()=>setMethod('cash')}><Text style={[styles.chipText, method==='cash'&&styles.chipTextActive]}>{t('cash','Cash')}</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.chip, method==='upi'&&styles.chipActive]} onPress={()=>setMethod('upi')}><Text style={[styles.chipText, method==='upi'&&styles.chipTextActive]}>{t('upi','UPI')}</Text></TouchableOpacity>
        </View>
      </View>
      <View style={styles.row}><Text style={styles.label}>Ref #</Text>
        <TextInput style={styles.input} value={reference} onChangeText={setReference} placeholder="optional" placeholderTextColor={colors.textLight} />
      </View>
      {method==='upi' && (
        <View style={{ marginTop: spacing.md }}>
          <Button variant="secondary" onPress={generateQr}>{t('scan-to-pay','Scan to pay ₹{amount}').replace('{amount}', amount || '0')}</Button>
          {qrUri && <Image source={{ uri: qrUri }} style={{ width: 200, height: 200, alignSelf: 'center', marginTop: spacing.sm }} />}
        </View>
      )}
      <View style={{ marginTop: spacing.lg }}>
        <Button variant="primary" onPress={recordPayment} loading={loading}>{t('confirm-collection','Confirm Collection')}</Button>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  row: { marginBottom: spacing.md },
  label: { ...typography.bodySmall, color: colors.text, marginBottom: spacing.xs },
  input: { borderWidth:1, borderColor: colors.border, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: 10, color: colors.text, backgroundColor: colors.white },
  methodRow: { flexDirection:'row', gap: spacing.sm },
  chip: { borderWidth:1, borderColor: colors.border, borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: colors.white },
  chipActive: { backgroundColor: colors.primary },
  chipText: { ...typography.caption, color: colors.textSecondary },
  chipTextActive: { color: colors.white, fontWeight: '600' },
});
