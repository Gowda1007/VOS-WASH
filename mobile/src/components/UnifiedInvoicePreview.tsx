import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { colors, spacing, typography } from '../styles/theme';
import { useLanguage } from '../context/LanguageContext';
import type { Invoice, Language } from '../core/types';
import { calculateInvoiceTotalsFromInvoice, formatInvoiceDate, isValidGstNumber, isToday } from '../core/utils/invoiceUtils';
import { invoiceLayout } from '../core/invoiceLayout';

const formatPrice = (num: number): string => {
  if (Math.abs(num) >= 100000) {
    return Math.round(num).toLocaleString('en-IN');
  }
  return num.toFixed(2);
};

interface Props {
  invoiceData: Invoice;
  language: Language;
  company?: {
    name: string;
    tagline?: string;
    address: string;
    phone: string;
    email?: string;
    gstNumber?: string;
  };
}

const A4_RATIO = 1.414;
const screenWidth = Dimensions.get('window').width;
const previewWidth = Math.min(screenWidth - 32, 360);
const previewHeight = previewWidth * A4_RATIO;

export const UnifiedInvoicePreview: React.FC<Props> = ({ invoiceData, language, company }) => {
  const { invoiceT } = useLanguage();
  const translate = (key: string) => invoiceT(key, language);

  const { services, customerName, customerAddress, customerPhone, invoiceNumber, invoiceDate, payments = [], oldBalance, advancePaid } = invoiceData;
  const hasValidGst = isValidGstNumber(company?.gstNumber);
  const { subtotal, tax, discount, oldBalance: ob, advancePaid: ap, paymentsTotal, totalDue, balance } = 
    calculateInvoiceTotalsFromInvoice(invoiceData, hasValidGst);

  const hasFinancialDetails = (oldBalance && oldBalance.amount > 0) || (advancePaid && advancePaid.amount > 0) || (paymentsTotal > 0);
  const rawTagline = company?.tagline || translate('app-tagline');
  const normalizedTagline = rawTagline.replace(/^\((.*)\)$/,'$1');

  return (
    <View style={styles.previewCard}>
      <View style={styles.header}>
        <Image source={require('../../assets/sri-vari.png')} style={styles.variImage} resizeMode="contain" />
        <View style={styles.logoRow}>
          <Image source={require('../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
          <View style={styles.logoTextBlock}>
            <Text style={styles.businessName}>{(company?.name || translate('app-name-invoice')) || 'VOS WASH'}</Text>
            <Text style={styles.tagline}>({normalizedTagline || 'Clean Everything'})</Text>
          </View>
        </View>
        <View style={styles.headerSeparator} />
      </View>
      <View style={styles.infoSection}>
        <View style={styles.customerInfo}>
          <Text style={styles.sectionTitle}>{translate('bill-to')}</Text>
          <Text style={styles.customerName}>{customerName || 'N/A'}</Text>
          <Text style={styles.customerDetail}>{customerPhone || 'N/A'}</Text>
          {customerAddress && customerAddress !== 'N/A' && <Text style={styles.customerDetail}>{customerAddress}</Text>}
        </View>
        <View style={styles.invoiceInfo}>
          <Text style={styles.invoiceLabel}>{translate('invoice-details')}</Text>
          <Text style={styles.invoiceDetail}>{translate('invoice-number')} {invoiceNumber || 'N/A'}</Text>
          <Text style={styles.invoiceDetail}>{translate('date')} {formatInvoiceDate(invoiceDate || new Date().toISOString().slice(0,10))}</Text>
          <View style={styles.businessAddressBlock}>
            <Text style={styles.businessAddressHeading}>{translate('business-address')}</Text>
            <Text style={styles.businessAddressLine}>Uttarahalli, Bengaluru - 61</Text>
            {company?.phone && <Text style={styles.businessAddressLine}>{company.phone}{company?.email && ` | ${company.email}`}</Text>}
            {!!company?.gstNumber && <Text style={styles.businessAddressLine}>GST: {company.gstNumber}</Text>}
          </View>
        </View>
      </View>
      <View style={styles.tableOuter}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 0.5 }]}>{translate('sl-no')}</Text>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>{translate('service')}</Text>
          <Text style={[styles.tableHeaderCell, { flex: 0.8, textAlign: 'center' }]}>{translate('qty')}</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>{translate('price')}</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>AMOUNT</Text>
        </View>
        {services.map((s, i) => (
          <View key={i} style={[styles.tableRow, i % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}>
            <Text style={[styles.tableCell, { flex: 0.5 }]}>{i + 1}</Text>
            <Text style={[styles.tableCell, styles.serviceCell, { flex: 2 }]}>{translate(s.name)}</Text>
            <Text style={[styles.tableCell, { flex: 0.8, textAlign: 'center' }]}>{s.quantity}</Text>
            <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>₹{formatPrice(s.price / s.quantity)}</Text>
            <Text style={[styles.tableCell, { flex: 1, textAlign: 'right', fontWeight: '600' }]}>₹{formatPrice(s.price)}</Text>
          </View>
        ))}
      </View>
      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{translate('subtotal')}:</Text>
          <Text style={styles.summaryValue}>₹{subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{translate('gst')}:</Text>
          <Text style={styles.summaryValue}>+ ₹{tax.toFixed(2)}</Text>
        </View>
        {discount > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{translate('discount')}:</Text>
            <Text style={styles.summaryValue}>- ₹{discount.toFixed(2)}</Text>
          </View>
        )}
        <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 4, marginTop: 2 }]}>
          <Text style={[styles.summaryLabel, { fontWeight: '600', color: colors.primary }]}>{translate('total-due')}</Text>
          <Text style={[styles.summaryValue, { fontWeight: '600', color: colors.primary }]}>₹{totalDue.toFixed(2)}</Text>
        </View>
        {paymentsTotal > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{translate('amount-paid')} ({formatInvoiceDate(payments[0]?.date || new Date().toISOString())})</Text>
            <Text style={styles.summaryValue}>- ₹{paymentsTotal.toFixed(2)}</Text>
          </View>
        )}
        {paymentsTotal > 0 && (
          <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 4, marginTop: 2 }]}>
            <Text style={[styles.summaryLabel, { fontWeight: '600', color: colors.primary }]}>{translate('balance')}</Text>
            <Text style={[styles.summaryValue, { fontWeight: '600', color: colors.primary }]}>₹{balance.toFixed(2)}</Text>
          </View>
        )}
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerGenerated}>{translate('footer-generated')}</Text>
        <Text style={styles.footerThanks}>{translate('footer-thanks')}</Text>
        <Text style={styles.footerServices}>{translate('footer-services')}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  previewCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'column',
    width: previewWidth,
    height: previewHeight,
  },
  header: { alignItems: 'center', marginBottom: spacing.xs },
  variImage: { width: Math.round(invoiceLayout.logoSize * invoiceLayout.variWidthFactor), height: invoiceLayout.logoSize, marginBottom: 2, marginLeft: 8 },
  logoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  logoImage: { width: invoiceLayout.logoSize, height: invoiceLayout.logoSize },
  logoTextBlock: { flexDirection: 'column', alignItems: 'flex-end' },
  businessName: { fontSize: 16, fontWeight: '700', color: colors.primary, lineHeight: 20, textAlign: 'right' },
  tagline: { fontSize: 7, color: colors.textSecondary, marginTop: 1, textAlign: 'right' },
  headerSeparator: { height: 1, backgroundColor: colors.border, width: '100%', marginTop: spacing.xs, marginBottom: spacing.xs },
  infoSection: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  customerInfo: { flex: 1 },
  sectionTitle: { fontSize: 8, fontWeight: '600', color: colors.textSecondary, marginBottom: 2 },
  customerName: { fontSize: 10, fontWeight: 'bold', color: colors.text },
  customerDetail: { fontSize: 8, color: colors.textSecondary },
  invoiceInfo: { alignItems: 'flex-end' },
  invoiceLabel: { fontSize: 8, fontWeight: '600', color: colors.textSecondary, marginBottom: 2 },
  invoiceDetail: { fontSize: 8, color: colors.text, fontWeight: '600' },
  tableOuter: { borderWidth: 1, borderColor: colors.primary, borderRadius: 4, overflow: 'hidden', marginBottom: spacing.xs },
  tableHeader: { flexDirection: 'row', backgroundColor: colors.primary, paddingVertical: 4, paddingHorizontal: 4, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  tableHeaderCell: { fontSize: 8, color: colors.white, fontWeight: '600' },
  tableRow: { flexDirection: 'row', paddingVertical: 3, paddingHorizontal: 4, borderBottomWidth: 1, borderColor: colors.borderLight },
  tableRowEven: { backgroundColor: '#f0f7ff' },
  tableRowOdd: { backgroundColor: colors.white },
  tableCell: { fontSize: 7, color: colors.text },
  serviceCell: { fontSize: 6 },
  summary: { marginTop: 'auto', paddingTop: spacing.xs, borderTopWidth: 1, borderColor: colors.border, alignSelf: 'flex-end', minWidth: '50%' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2, minWidth: 200 },
  summaryLabel: { fontSize: 9, color: colors.textSecondary },
  summaryValue: { fontSize: 9, color: colors.text },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4, marginTop: 4, borderTopWidth: 2, borderColor: colors.primary },
  grandTotalLabel: { fontSize: 9, color: colors.primary, fontWeight: '600' },
  grandTotalValue: { fontSize: 9, color: colors.primary, fontWeight: '600' },
  businessAddressBlock: { marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderStyle: 'dashed', borderColor: colors.border, width: '100%', alignItems: 'flex-end' },
  businessAddressHeading: { fontSize: 8, fontWeight: '600', color: colors.textSecondary, textAlign: 'right' },
  businessAddressLine: { fontSize: 7, color: colors.textSecondary, textAlign: 'right' },
  errorText: { color: colors.error },
  successText: { color: colors.success },
  footer: { marginTop: 'auto', paddingTop: spacing.xs, borderTopWidth: 1, borderColor: colors.border, alignItems: 'center', paddingBottom: spacing.xs },
  footerGenerated: { fontSize: 8, color: colors.textSecondary, textAlign: 'center' },
  footerThanks: { fontSize: 8, color: colors.textSecondary, textAlign: 'center' },
  footerServices: { fontSize: 6, color: colors.primary, marginTop: 3, textAlign: 'center', lineHeight: 8, fontWeight: '500' },
});