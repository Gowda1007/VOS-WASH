import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native'; // FIX: Imported Platform
import type { Invoice, Language } from '../types';
import { calculateInvoiceTotal, calculateRemainingBalance } from '../hooks/useInvoices';
import { Logo, Vari } from './Common';
import { useLanguage } from '../hooks/useLanguage';

const formatDateForDisplay = (dateStr: string | undefined): string => {
    if (!dateStr) return '';
    // Assuming dateStr is already in a displayable format like DD/MM/YYYY for RN as well
    // If it comes as YYYY-MM-DD, adjust parsing here.
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return `(${dateStr})`;
    if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
        const [d, m, y] = dateStr.split('/');
        return `(${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')})`;
    }
    return `(${dateStr})`;
};

interface FinancialEntryProps {
  label: string;
  amount: number;
  date?: string;
  sign: '+' | '-';
  color: 'red' | 'green' | 'blue';
}

const FinancialEntry: React.FC<FinancialEntryProps> = ({ label, amount, date, sign, color }) => {
  const colorStyles = {
    red: styles.textRed,
    green: styles.textGreen,
    blue: styles.textBlue,
  };

  return (
    <View style={styles.financialEntryRow}> {/* FIX: Removed colorStyles[color] from View style */}
      <Text style={[styles.financialEntryLabel, colorStyles[color]]}>{label} {formatDateForDisplay(date)}</Text> {/* FIX: Applied color to Text */}
      <Text style={[styles.financialEntryAmount, colorStyles[color]]}>{sign} ₹{amount.toFixed(2)}</Text> {/* FIX: Applied color to Text */}
    </View>
  );
};


interface InvoicePreviewProps {
  invoiceData: Invoice;
  language?: Language;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoiceData, language = 'en' }) => {
  const { services, customerName, customerAddress, customerPhone, invoiceNumber, invoiceDate, payments, oldBalance, advancePaid } = invoiceData;
  const { invoiceT } = useLanguage();
  const t = (key: string) => invoiceT(key, language);

  const serviceTotal = calculateInvoiceTotal(services);
  const balanceDue = calculateRemainingBalance(invoiceData);
  const subtotal = services.reduce((sum, s) => sum + (s.price * s.quantity), 0);
  const tax = subtotal * 0.18;
  const discount = tax; // Assuming discount equals tax for this simplified example

  const hasFinancialDetails = (oldBalance && oldBalance.amount > 0) ||
                              (advancePaid && advancePaid.amount > 0) ||
                              (payments && payments.some(p => p.amount > 0));

  return (
    <View style={styles.invoiceContainer}>
      <View style={styles.invoiceContent}>
        <View style={styles.flexGrow}>
          <View style={styles.header}>
            <Vari style={styles.variLogo} />
            <View style={styles.appTitleContainer}>
              <Logo style={styles.logo} />
              <View style={styles.appTitleTextContainer}>
                <Text style={styles.appTitle}>{t('app-name-invoice')}</Text>
                <Text style={styles.appTagline}>{t('app-tagline')}</Text>
              </View>
            </View>
          </View>

          <View style={styles.billToSection}>
            <View>
              <Text style={styles.billToHeader}>{t('bill-to')}</Text>
              <Text style={styles.billToText}>{customerName}</Text>
              {customerAddress && customerAddress !== 'N/A' && <Text style={styles.billToText}>{customerAddress}</Text>}
              <Text style={styles.billToText}>{customerPhone}</Text>
            </View>
            <View style={styles.invoiceInfo}>
              <Text style={styles.invoiceHeaderTitle}>{t('invoice-header')}</Text>
              <Text style={styles.invoiceInfoText}>
                <Text style={styles.invoiceInfoStrong}>{t('invoice-number')}</Text> {invoiceNumber}
              </Text>
              <Text style={styles.invoiceInfoText}>
                <Text style={styles.invoiceInfoStrong}>{t('date')}</Text> {invoiceDate}
              </Text>
              <View style={styles.businessAddressContainer}>
                <Text style={styles.businessAddressText}>{t('business-address')}</Text>
                <Text style={styles.businessAddressText}>+919845418725 / 6363178431</Text>
              </View>
            </View>
          </View>

          <View style={styles.servicesSection}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.slNoCol]}>{t('sl-no')}</Text>
              <Text style={[styles.tableHeaderText, styles.serviceCol]}>{t('service')}</Text>
              <Text style={[styles.tableHeaderText, styles.qtyCol]}>{t('qty')}</Text>
              <Text style={[styles.tableHeaderText, styles.priceCol]}>{t('price')}</Text>
              <Text style={[styles.tableHeaderText, styles.totalCol]}>{t('total')}</Text>
            </View>
            {services.map((s, i) => (
              <View key={i} style={[styles.tableRow, i % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
                <Text style={[styles.tableCell, styles.slNoCol]}>{i + 1}</Text>
                <Text style={[styles.tableCell, styles.serviceCol]}>{t(s.name)}</Text>
                <Text style={[styles.tableCell, styles.qtyCol]}>{s.quantity}</Text>
                <Text style={[styles.tableCell, styles.priceCol]}>₹{s.price.toFixed(2)}</Text>
                <Text style={[styles.tableCell, styles.totalCol, styles.fontSemibold]}>₹{(s.price * s.quantity).toFixed(2)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.summarySection}>
            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('subtotal')}</Text>
                <Text style={styles.summaryValue}>₹{subtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('gst')}</Text>
                <Text style={styles.summaryValue}>+ ₹{tax.toFixed(2)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.dashedBorderBottom]}>
                <Text style={styles.summaryLabel}>{t('discount')}</Text>
                <Text style={styles.summaryValue}>- ₹{discount.toFixed(2)}</Text>
              </View>

              <View style={styles.serviceTotalRow}>
                <Text style={styles.serviceTotalLabel}>{hasFinancialDetails ? t('service-total') : t('grand-total')}</Text>
                <Text style={styles.serviceTotalValue}>₹{serviceTotal.toFixed(2)}</Text>
              </View>

              {hasFinancialDetails && (
                <View style={styles.financialDetailsBlock}>
                  {oldBalance && oldBalance.amount > 0 &&
                    <FinancialEntry label={t('old-balance')} amount={oldBalance.amount} date={oldBalance.date} sign="+" color="red" />}
                  {advancePaid && advancePaid.amount > 0 &&
                    <FinancialEntry label={t('advance-paid')} amount={advancePaid.amount} date={advancePaid.date} sign="-" color="green" />}
                  {payments.map((p, i) =>
                    <FinancialEntry key={i} label={t('now-paid')} amount={p.amount} date={p.date} sign="-" color="blue" />)}
                </View>
              )}

              {hasFinancialDetails && (
                <View style={styles.balanceDueRow}> {/* FIX: Changed borderStyle to 'solid' */}
                  <Text style={styles.balanceDueLabel}>{t('balance-due')}</Text>
                  <Text style={styles.balanceDueValue}>₹{balanceDue.toFixed(2)}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('footer-generated')}</Text>
          <Text style={styles.footerText}>{t('footer-thanks')}</Text>
          <Text style={styles.footerServicesText}>{t('footer-services')}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  invoiceContainer: {
    width: '100%',
    padding: 16, // Equivalent to p-4 sm:p-8
    backgroundColor: '#f1f5f9', // bg-slate-100
  },
  invoiceContent: {
    backgroundColor: '#ffffff', // bg-white
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    padding: 32, // Equivalent to p-12
    flexDirection: 'column',
    flexGrow: 1,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto', // Default font
    color: '#334155', // text-gray-800
  },
  flexGrow: {
    flexGrow: 1,
  },
  header: {
    textAlign: 'center',
    marginBottom: 20, // mb-5
    paddingBottom: 16, // pb-4
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1', // border-b
  },
  variLogo: {
    width: 224, // w-56
    height: 30, // Approximate height for text
    alignSelf: 'center',
    marginBottom: 8, // mb-2
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 24,
    color: '#334155',
  },
  appTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 96, // w-24
    height: 96, // h-24
    marginRight: 8,
  },
  appTitleTextContainer: {
    flexDirection: 'column',
  },
  appTitle: {
    fontSize: 40, // text-5xl
    fontWeight: 'bold',
    color: '#1d4ed8', // text-blue-700
  },
  appTagline: {
    fontSize: 16, // text-xl
    textAlign: 'right',
    color: '#475569', // text-gray-600
  },
  billToSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16, // mb-4
    fontSize: 16, // text-lg
  },
  billToHeader: {
    fontWeight: 'bold',
    fontSize: 18, // text-xl
    color: '#374151', // text-gray-700
    marginBottom: 8, // mb-2
  },
  billToText: {
    color: '#475569', // text-gray-700
    marginBottom: 2,
  },
  invoiceInfo: {
    alignItems: 'flex-end',
  },
  invoiceHeaderTitle: {
    fontSize: 18, // text-xl
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#374151', // text-gray-700
  },
  invoiceInfoText: {
    color: '#64748b', // text-gray-500
    marginBottom: 2,
  },
  invoiceInfoStrong: {
    fontWeight: 'bold',
  },
  businessAddressContainer: {
    paddingTop: 4, // pt-1
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0', // border-t border-dashed
    borderStyle: 'dashed',
    marginTop: 8,
  },
  businessAddressText: {
    color: '#64748b',
    fontWeight: '600',
  },
  servicesSection: {
    marginBottom: 32, // mb-8
    borderWidth: 1,
    borderColor: '#2563eb', // border border-blue-600
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2563eb', // bg-blue-600
    borderBottomWidth: 2,
    borderBottomColor: '#1e40af', // border-b-2 border-blue-800
  },
  tableHeaderText: {
    color: '#ffffff', // text-white
    padding: 6, // p-1.5
    fontWeight: '600', // font-semibold
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0', // border-b border-gray-200
  },
  rowEven: {
    backgroundColor: '#ffffff', // bg-white
  },
  rowOdd: {
    backgroundColor: '#eff6ff', // bg-blue-50
  },
  tableCell: {
    padding: 6, // p-1.5
    color: '#334155', // Default text-gray-800
  },
  fontSemibold: {
    fontWeight: '600',
  },
  slNoCol: {
    width: '10%',
    textAlign: 'left',
  },
  serviceCol: {
    width: '40%',
    textAlign: 'left',
  },
  qtyCol: {
    width: '15%',
    textAlign: 'center',
  },
  priceCol: {
    width: '17.5%',
    textAlign: 'right',
  },
  totalCol: {
    width: '17.5%',
    textAlign: 'right',
  },
  summarySection: {
    alignSelf: 'flex-end',
    width: '50%', // w-1/2
    marginTop: 'auto',
    fontSize: 16, // text-lg
  },
  summaryBox: {
    // Styling for the container of subtotal, tax, discount
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4, // mb-1
    color: '#374151', // text-gray-700
  },
  summaryLabel: {
    // Specific styles might be needed per color
  },
  summaryValue: {
    // Specific styles might be needed per color
  },
  dashedBorderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0', // border-b border-dashed
    borderStyle: 'dashed',
    paddingBottom: 4,
    marginBottom: 4,
  },
  serviceTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4, // mt-1
    paddingTop: 4, // pt-1
    fontWeight: 'bold', // font-extrabold
    fontSize: 18, // text-lg
    color: '#1d4ed8', // text-blue-700
  },
  serviceTotalLabel: {
    color: '#1d4ed8',
  },
  serviceTotalValue: {
    color: '#1d4ed8',
  },
  financialDetailsBlock: {
    marginTop: 8, // mt-2
    paddingTop: 8, // pt-2
    paddingBottom: 8, // pb-2
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: '#9ca3af', // border-t border-b border-dashed border-gray-400
    borderBottomColor: '#9ca3af',
    borderStyle: 'dashed',
  },
  financialEntryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8, // mb-2
    fontSize: 16, // text-lg
  },
  financialEntryLabel: {
    // Specific styles might be needed per color
  },
  financialEntryAmount: {
    // Specific styles might be needed per color
  },
  textRed: {
    color: '#dc2626', // text-red-600
  },
  textGreen: {
    color: '#16a34a', // text-green-600
  },
  textBlue: {
    color: '#2563eb', // text-blue-600
  },
  balanceDueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontWeight: 'bold', // font-extrabold
    fontSize: 20, // text-xl
    marginTop: 8, // mt-2
    paddingTop: 8, // pt-2
    borderTopWidth: 4,
    borderTopColor: '#2563eb', // border-t-4 border-double border-blue-600
    borderStyle: 'solid', // FIX: Changed 'double' to 'solid'
  },
  balanceDueLabel: {
    color: '#1e40af', // text-blue-800
  },
  balanceDueValue: {
    color: '#1e40af', // text-blue-800
  },
  footer: {
    width: '100%',
    textAlign: 'center',
    fontSize: 12, // text-sm
    color: '#64748b', // text-gray-500
    marginTop: 32, // mt-8
    paddingTop: 8, // pt-2
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0', // border-t
  },
  footerText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  footerServicesText: {
    marginTop: 4, // mt-1
    fontSize: 14, // text-base
    lineHeight: 18, // leading-tight
    letterSpacing: -0.2, // tracking-tighter
    fontWeight: '500', // font-medium
    color: '#1d4ed8', // text-blue-700
  },
});