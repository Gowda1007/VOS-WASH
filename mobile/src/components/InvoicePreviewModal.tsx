import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Modal, Button } from './Common';
import type { Invoice } from '../core/types';
import { useLanguage } from '../context/LanguageContext';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { pdfAdapter, shareAdapter } from '../services';
import { calculateInvoiceTotal, calculateTotalDue, calculateTotalPaid, calculateRemainingBalance, formatCurrency } from '../core/utils/invoiceUtils';

interface InvoicePreviewModalProps {
  visible: boolean;
  invoice: Invoice | null;
  onClose: () => void;
  onEdit?: () => void;
}

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({ visible, invoice, onClose, onEdit }) => {
  const { t, language } = useLanguage();
  if (!invoice) return null;

  const serviceTotal = calculateInvoiceTotal(invoice.services);
  const totalDue = calculateTotalDue(invoice);
  const totalPaid = calculateTotalPaid(invoice);
  const balance = calculateRemainingBalance(invoice);

  const handleDownloadPdf = async () => {
    try {
      const res = await pdfAdapter.generateInvoicePdf({
        invoice,
        companyName: t('app-name','VOS WASH'),
        companyAddress: 'Uttarahalli, Bengaluru - 61',
        companyPhone: '+91 0000000000',
        companyEmail: 'voswash@example.com'
      });
      if (res.success && res.filePath) {
        await pdfAdapter.openPdf?.(res.filePath);
      }
    } catch (e) { console.error('PDF download failed', e); }
  };

  const handleShareWhatsApp = async () => {
    try {
      const res = await pdfAdapter.generateInvoicePdf({
        invoice,
        companyName: t('app-name','VOS WASH'),
        companyAddress: 'Uttarahalli, Bengaluru - 61',
        companyPhone: '+91 0000000000',
        companyEmail: 'voswash@example.com'
      });
      if (res.success && res.filePath) {
        const msg = t('whatsapp-share-message','Invoice shared').replace('{customerName}', invoice.customerName).replace('{amountPaid}', totalPaid.toString()).replace('{invoiceNumber}', invoice.invoiceNumber);
        await shareAdapter.shareToWhatsApp({ phoneNumber: invoice.customerPhone, message: msg, filePath: res.filePath });
      }
    } catch (e) { console.error('WhatsApp share failed', e); }
  };

  return (
    <Modal visible={visible} onClose={onClose} title={t('invoice-preview-title','Invoice Preview')}>
      <ScrollView>
        <Text style={styles.heading}>{t('invoice-for','Invoice').replace('{invoiceNumber}', invoice.invoiceNumber).replace('{customerName}', invoice.customerName)}</Text>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('customer-details','Customer Details')}</Text>
          <Text style={styles.line}>{invoice.customerName}</Text>
          <Text style={styles.line}>{invoice.customerPhone}</Text>
          {invoice.customerAddress && <Text style={styles.line}>{invoice.customerAddress}</Text>}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('services-and-items','Services')}</Text>
          {invoice.services.map((svc, i) => (
            <View key={i} style={styles.serviceRow}>
              <Text style={styles.serviceName}>{svc.name}</Text>
              <Text style={styles.serviceQty}>×{svc.quantity}</Text>
              <Text style={styles.servicePrice}>{formatCurrency(svc.price)}</Text>
            </View>
          ))}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('financials','Financials')}</Text>
          <View style={styles.totals}> 
            <Row label={t('service-total','Services Total')} value={formatCurrency(serviceTotal)} />
            {invoice.oldBalance?.amount ? <Row label={t('old-balance','Old Balance')} value={formatCurrency(invoice.oldBalance.amount)} /> : null}
            {invoice.advancePaid?.amount ? <Row label={t('advance-paid','Advance Paid')} value={`- ${formatCurrency(invoice.advancePaid.amount)}`} /> : null}
            <Row label={t('balance-due-label','Balance Due:')} value={formatCurrency(totalDue)} />
            <Row label={t('paid-amount','Paid Amount')} value={formatCurrency(totalPaid)} />
            <Row label={t('balance-due-label','Balance Due:')} value={formatCurrency(balance)} />
          </View>
        </View>
        <View style={styles.actions}> 
          {onEdit && <Button variant="secondary" onPress={onEdit}>{t('edit-details','Edit Details')}</Button>}
          <Button variant="primary" onPress={handleDownloadPdf}>{t('download-pdf','Download PDF')}</Button>
          <Button variant="primary" onPress={handleShareWhatsApp}>{t('share-on-whatsapp','Share on WhatsApp')}</Button>
        </View>
      </ScrollView>
    </Modal>
  );
};

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.row}><Text style={styles.rowLabel}>{label}</Text><Text style={styles.rowValue}>{value}</Text></View>
);

const styles = StyleSheet.create({
  heading: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.bodySmall, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.sm },
  line: { ...typography.bodySmall, color: colors.text },
  serviceRow: { flexDirection:'row', justifyContent:'space-between', paddingVertical:4 },
  serviceName: { ...typography.bodySmall, color: colors.text, flex:1 },
  serviceQty: { ...typography.caption, color: colors.textSecondary, width:40, textAlign:'right' },
  servicePrice: { ...typography.caption, color: colors.text, width:80, textAlign:'right' },
  totals: { gap:4 },
  row: { flexDirection:'row', justifyContent:'space-between' },
  rowLabel: { ...typography.caption, color: colors.textSecondary },
  rowValue: { ...typography.caption, color: colors.text, fontWeight:'600' },
  actions: { flexDirection:'column', gap:spacing.sm },
});
