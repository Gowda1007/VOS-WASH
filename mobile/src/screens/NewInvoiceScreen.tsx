import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Animated } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { colors, spacing, typography } from '../styles/theme';
import { CustomerDetailsStep, validateCustomerDetails, CustomerDetailsValue } from '../components/CustomerDetailsStep';
import { ServiceSelectionStep, validateSelectedServices } from '../components/ServiceSelectionStep';
import { FinancialsStep, FinancialsValue } from '../components/FinancialsStep';
import { UnifiedInvoicePreview } from '../components/UnifiedInvoicePreview';
import { PaymentCollectionStep } from '../components/PaymentCollectionStep';
import type { CustomerType, Customer, Invoice, Language, PaymentMethod } from '../core/types';
import { useCustomers } from '../hooks/useCustomers';
import { useInvoices, getUniqueInvoiceNumber } from '../hooks/useInvoices';
import { calculateRemainingBalance } from '../core/utils/invoiceUtils';
import { useServices } from '../hooks/useServices';
import { useAppSettings } from '../hooks/useAppSettings';
import { useToast } from '../context/ToastContext';
import { pdfAdapter, shareAdapter, notificationAdapter } from '../adapters';
import { Button } from '../components/Common';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { usePendingOrders } from '../hooks/usePendingOrders';
import { VoiceInvoiceInput } from '../components/VoiceInvoiceInput';
import { VoiceCommandResult } from '../core/utils/voiceParser';
import { getWhatsAppMessage } from '../core/utils/whatsappTemplates';
import { useDynamicPricing } from '../hooks/useDynamicPricing';

export const NewInvoiceScreen: React.FC = () => {
  const { t, invoiceT } = useLanguage();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { customers, addOrUpdateCustomer } = useCustomers();
  const { invoices, addInvoice, updateInvoice, recordPayment } = useInvoices();
  const { serviceSets } = useServices();
  const { settings: appSettings } = useAppSettings();
  const toast = useToast();
  const { deletePendingOrder } = usePendingOrders();

  const [step, setStep] = useState(1);
  const [details, setDetails] = useState<CustomerDetailsValue>({
    name: '',
    phone: '',
    address: '',
    customerType: 'customer' as CustomerType,
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [services, setServices] = useState<import('../core/types').Service[]>([]);
  const [financials, setFinancials] = useState<FinancialsValue>({
    showOldBalance: false,
    oldBalance: { amount: 0, date: '' },
    showAdvancePaid: false,
    advancePaid: { amount: 0, date: '' },
  });
  const [invoiceLanguage, setInvoiceLanguage] = useState<Language>(appSettings.invoiceLanguage || 'en');
  const [previewData, setPreviewData] = useState<Invoice | null>(null);
  const [savedInvoice, setSavedInvoice] = useState<Invoice | null>(null);
  const [isProcessing, setIsProcessing] = useState(false); // For payment collection/save/update
  const [isDownloading, setIsDownloading] = useState(false); // For PDF download
  const [isSharing, setIsSharing] = useState(false); // For WhatsApp sharing
  const [paymentCollected, setPaymentCollected] = useState(false);
  const progressAnim = useRef(new Animated.Value((step / 5) * 100)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (step / 5) * 100,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [step, progressAnim]);

  // Invoice language is independent from app UI language; default comes from app settings

  // Auto populate financials.oldBalance when phone is entered and prior unpaid exists
  useEffect(() => {
    const phoneDigits = (details.phone || '').replace(/\D/g, '');
    if (!phoneDigits || phoneDigits.length !== 10) return;

    // If financials already set by user, don't override
    const hasUserOld = financials.showOldBalance && financials.oldBalance?.amount > 0;
    const hasUserAdvance = financials.showAdvancePaid && financials.advancePaid?.amount > 0;

    const invMatches = invoices
      .filter(inv => (inv.customerPhone || '').replace(/\D/g,'') === phoneDigits)
      .map(inv => ({ inv, rem: calculateRemainingBalance(inv) }));
    if (!invMatches || invMatches.length === 0) return;

    // Sum remaining balances and get latest invoice date for unpaid
    const unpaidMatches = invMatches.filter(x => x.rem > 0);
    const priorUnpaidSum = unpaidMatches.reduce((sum, x) => sum + x.rem, 0);
    const latestUnpaidDate = unpaidMatches.reduce((acc, x) => {
      if (!x.inv.invoiceDate) return acc;
      return (!acc || x.inv.invoiceDate > acc) ? x.inv.invoiceDate : acc;
    }, '');

    // Sum overpaid amounts (advances) as absolute sum of negative balances; get latest negative invoice date
    const overpaidMatches = invMatches.filter(x => x.rem < 0);
    const priorAdvanceSum = overpaidMatches.reduce((sum, x) => sum + Math.abs(x.rem), 0);
    const latestOverpaidDate = overpaidMatches.reduce((acc, x) => {
      if (!x.inv.invoiceDate) return acc;
      return (!acc || x.inv.invoiceDate > acc) ? x.inv.invoiceDate : acc;
    }, '');

    // Prepare update object; only set values that are not manually provided by user
    setFinancials(prev => ({
      ...prev,
      showOldBalance: hasUserOld ? prev.showOldBalance : (priorUnpaidSum > 0),
      oldBalance: hasUserOld ? prev.oldBalance : (priorUnpaidSum > 0 ? { amount: Math.round(priorUnpaidSum), date: latestUnpaidDate || new Date().toISOString().slice(0,10) } : prev.oldBalance),
      showAdvancePaid: hasUserAdvance ? prev.showAdvancePaid : (priorAdvanceSum > 0),
      advancePaid: hasUserAdvance ? prev.advancePaid : (priorAdvanceSum > 0 ? { amount: Math.round(priorAdvanceSum), date: latestOverpaidDate || new Date().toISOString().slice(0,10) } : prev.advancePaid),
    }));
  }, [details.phone, invoices]);

  // Prefill from pending order OR voice command
  useEffect(() => {
    const fromOrder = route.params?.fromOrder;
    const voiceResult = route.params?.voiceResult;

    if (fromOrder && !previewData) {
      setDetails({
        name: fromOrder.customerName,
        phone: fromOrder.customerPhone,
        address: fromOrder.customerAddress,
        customerType: fromOrder.customerType,
      });
      setServices(fromOrder.services.map((s: any) => ({ ...s })));
      // ... (existing logic for advancePaid)
      if (fromOrder.advancePaid?.amount) {
        setFinancials(prev => ({
          ...prev,
          showAdvancePaid: true,
          advancePaid: { amount: fromOrder.advancePaid.amount, date: fromOrder.advancePaid.date || '' }
        }));
      }
      setStep(3); 
    } else if (voiceResult && !previewData) {
        // Handle Voice Input
        onVoiceResult(voiceResult);
        // Note: onVoiceResult handles looking up existing customers too
    } else if (!fromOrder && !voiceResult) {
       // Reset logic ...
      setStep(1);
      setDetails({
        name: '',
        phone: '',
        address: '',
        customerType: 'customer' as CustomerType,
      });
      setServices([]);
      setFinancials({
        showOldBalance: false,
        oldBalance: { amount: 0, date: '' },
        showAdvancePaid: false,
        advancePaid: { amount: 0, date: '' },
      });
      setPreviewData(null);
      setSavedInvoice(null);
      setPaymentCollected(false);
      setErrors([]);
    }
  }, [route.params]);

  const onVoiceResult = (result: VoiceCommandResult) => {
    if (!result.phone) {
      toast.info(t('voice-no-phone', 'Could not detect phone number. Please try again.'));
      return;
    }

    // 1. Check if customer exists
    const existingCustomer = customers.find(c => c.phone === result.phone);
    
    // 2. Prepare new details
    const newDetails: CustomerDetailsValue = {
      ...details,
      phone: result.phone,
      // If existing, use DB name. If new, use spoken name or empty.
      name: existingCustomer ? existingCustomer.name : (result.name || details.name),
      address: existingCustomer ? existingCustomer.address : details.address,
      gstNumber: existingCustomer ? existingCustomer.gstNumber : details.gstNumber,
    };
    
    setDetails(newDetails);
    
    if (existingCustomer) {
      toast.success(t('voice-customer-found', 'Customer found! Auto-filled details.'));
    } else {
      toast.info(t('voice-new-customer', 'New customer phone detected.'));
    }

    // 3. Select Service if detected
    if (result.service) {
      // Simple fuzzy match across all categories
      const allServices = Object.values(serviceSets).flat();
      // Find best match (simple includes check for now)
      const matchedService = allServices.find(s => 
        s.name.toLowerCase().includes(result.service!.toLowerCase()) || 
        result.service!.toLowerCase().includes(s.name.toLowerCase())
      );

      if (matchedService) {
        setServices(prev => {
          // Avoid duplicates
          if (prev.some(s => s.name === matchedService.name)) return prev;
          return [...prev, { ...matchedService, quantity: 1 }];
        });
        toast.success(`${t('service-added', 'Service added')}: ${matchedService.name}`);
      } else {
         toast.info(`${t('voice-service-not-found', 'Service not found')}: ${result.service}`);
      }
    }
  };

  const onNextFromStep1 = () => {
    const { valid, errors } = validateCustomerDetails(details);
    if (!valid) {
      setErrors(errors);
      return;
    }
    setErrors([]);
    setStep(2); // Proceed to service selection (to be implemented next)
  };

  const onNextFromStep2 = () => {
    const { valid, errors } = validateSelectedServices(services);
    if (!valid) {
      setErrors(errors);
      return;
    }
    setErrors([]);
    setStep(3); // proceed to financials (next step)
  };

  const onBackFromStep2 = () => setStep(1);

  const onNextFromStep3 = () => {
    // No specific validation for financials; generate preview and move to step 4
    setErrors([]);
    
    // Build preview invoice data
    // Auto-compute prior unpaid balance if user did not manually set old balance
    let autoOldBalance: { amount: number; date: string } | undefined;
    let autoAdvancePaid: { amount: number; date: string } | undefined;
    if (!financials.showOldBalance && details.phone && details.phone.length === 10) {
      const priorUnpaid = invoices
        .filter(inv => inv.customerPhone === details.phone)
        .reduce((sum, inv) => {
          const remain = calculateRemainingBalance(inv);
          return sum + (remain > 0 ? remain : 0);
        }, 0);
      if (priorUnpaid > 0) {
        autoOldBalance = { amount: Math.round(priorUnpaid), date: new Date().toISOString().slice(0,10) };
      }
    }
    // Auto-compute prior overpayments (to be used as advance) if user did not manually set advancePaid
    if (!financials.showAdvancePaid && details.phone && details.phone.length === 10) {
      const priorAdvance = invoices
        .filter(inv => (inv.customerPhone || '').replace(/\D/g,'') === details.phone.replace(/\D/g,''))
        .reduce((sum, inv) => {
          const remain = calculateRemainingBalance(inv);
          return sum + (remain < 0 ? Math.abs(remain) : 0);
        }, 0);
      if (priorAdvance > 0) {
        // Choose latest invoice date where overpayment occurred
        const latestDate = invoices
          .filter(inv => (inv.customerPhone || '').replace(/\D/g,'') === details.phone.replace(/\D/g,''))
          .filter(inv => calculateRemainingBalance(inv) < 0)
          .reduce((acc, inv) => (!acc || inv.invoiceDate > acc) ? inv.invoiceDate : acc, '');
        autoAdvancePaid = { amount: Math.round(priorAdvance), date: latestDate || new Date().toISOString().slice(0,10) };
      }
    }

    const preview: Invoice = {
      invoiceNumber: 'PREVIEW',
      invoiceDate: new Date().toISOString().slice(0,10),
      customerName: details.name,
      customerPhone: details.phone,
      customerAddress: details.address,
      customerType: details.customerType,
      customerGstNumber: details.gstNumber,
      services,
      oldBalance: financials.showOldBalance && financials.oldBalance.amount > 0 ? financials.oldBalance : autoOldBalance,
      advancePaid: financials.showAdvancePaid && financials.advancePaid.amount > 0 ? financials.advancePaid : autoAdvancePaid,
      payments: [],
      language: invoiceLanguage,
    };
    setPreviewData(preview);
    setStep(4); // Preview step
  };

  const onBackFromStep3 = () => setStep(2);

  const onBackFromStep4 = () => setStep(3);
  // const onBackFromStep5 = () => setStep(4); // Removed as per user request

  const handleGoHome = () => {
    // Reset all state to initial values
    setStep(1);
    setDetails({
      name: '',
      phone: '',
      address: '',
      customerType: 'customer' as CustomerType,
    });
    setServices([]);
    setFinancials({
      showOldBalance: false,
      oldBalance: { amount: 0, date: '' },
      showAdvancePaid: false,
      advancePaid: { amount: 0, date: '' },
    });
    setPreviewData(null);
    setSavedInvoice(null);
    setPaymentCollected(false);
    setErrors([]);
    
    // Navigate back to the Dashboard screen
    navigation.navigate('Dashboard' as never);
  };
  
  const handleUpdateInvoice = async () => {
    if (!savedInvoice || !previewData) return;
    
    setIsProcessing(true);
    try {
      // Create update payload using savedInvoice's necessary metadata (_id, invoiceNumber)
      // and new data from previewData (services, financials)
      const updatePayload: Partial<Invoice> = {
        ...previewData,
        // Ensure critical fields are preserved from savedInvoice if not provided by previewData
        invoiceNumber: savedInvoice.invoiceNumber,
        language: invoiceLanguage,
      };

      const updated = await updateInvoice(savedInvoice.invoiceNumber, updatePayload);
      
      // Auto-sync customer
      try {
        const customerRecord: Customer = {
          phone: details.phone,
          name: details.name,
          gstNumber: details.gstNumber,
          address: details.address,
          customerType: details.customerType,
        };
        await addOrUpdateCustomer(customerRecord);
      } catch (custErr) {
        console.warn('Failed to auto-sync customer during update:', custErr);
      }
      
      if (updated) {
        setSavedInvoice(updated);
        setPaymentCollected(false); // Reset payment collected flag if invoice is updated
        toast.success(t('invoice-updated-successfully', 'Invoice updated successfully!'));
      } else {
        throw new Error('Failed to retrieve updated invoice.');
      }
      setStep(5); // Move back to payment/share step
    } catch (error) {
      toast.error(t('error-updating-invoice', 'Error updating invoice'));
      console.error('Error updating invoice:', error);
    } finally {
      setIsProcessing(false);
    }
  };


  const handleSaveInvoice = async () => {
    if (!previewData) return;
    
    setIsProcessing(true);
    try {
      // Generate final invoice number (replace PREVIEW)
      const invoiceNumber = getUniqueInvoiceNumber(invoices);
      const finalInvoice: Invoice = { 
        ...previewData, 
        invoiceNumber,
        payments: [], // Ensure no payments are accidentally carried from preview
        language: invoiceLanguage 
      };
      
      const saved = await addInvoice(finalInvoice);
      
      // Auto-sync customer: add or update customer with type from invoice
      try {
        const customerRecord: Customer = {
          phone: details.phone,
          name: details.name,
          address: details.address,
          customerType: details.customerType,
        };
        await addOrUpdateCustomer(customerRecord);
      } catch (custErr) {
        console.warn('Failed to auto-sync customer:', custErr);
      }

      // Delete pending order if invoice was generated from one
      const fromOrder = route.params?.fromOrder;
      if (fromOrder?.id) {
        try {
          await deletePendingOrder(fromOrder.id);
        } catch (orderErr) {
          console.warn('Failed to delete pending order after invoice generation:', orderErr);
        }
      }
      
      setSavedInvoice(saved);
      toast.success(t('invoice-saved-successfully', 'Invoice saved successfully!'));
      setStep(5); // Move to payment collection
    } catch (error) {
      toast.error(t('error-saving-invoice', 'Error saving invoice'));
      console.error('Error saving invoice:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCollectPayment = async (amount: number, method: PaymentMethod, referenceNumber?: string) => {
    if (!savedInvoice) return;
    
    setIsProcessing(true);
    try {
      const updatedInvoice = await recordPayment(savedInvoice.invoiceNumber, amount, method, referenceNumber);
      
      if (updatedInvoice) {
        setSavedInvoice(updatedInvoice);
        setPaymentCollected(true);
        toast.success(t('payment-recorded-successfully', 'Payment recorded successfully!'));
      }
    } catch (error) {
      toast.error(t('error-recording-payment', 'Error recording payment'));
      console.error('Error recording payment:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkipPayment = () => {
    // Navigate back or show share options without payment
    setPaymentCollected(true);
    toast.info(t('payment-skipped', 'Payment skipped. You can collect payment later.'));
  };

  const handleDownloadPdf = async () => {
    if (!savedInvoice) return;
    
    setIsDownloading(true);
    toast.info('Please wait... Generating PDF');
    try {
      const res = await pdfAdapter.generateInvoicePdf({
        invoice: { ...savedInvoice, language: invoiceLanguage },
        companyName: appSettings.companyName,
        companyAddress: appSettings.companyAddress,
        companyPhone: appSettings.companyPhone,
        companyEmail: appSettings.companyEmail,
        gstNumber: appSettings.gstNumber,
        companyTagline: appSettings.companyTagline,
      });
      if (res.success && res.filePath) {
        notificationAdapter.showNotification?.({ title: t('download-pdf', 'Download PDF'), body: t('pdf-downloaded', 'PDF downloaded successfully!') });
        toast.success(t('pdf-downloaded', 'PDF downloaded successfully!'));
      } else {
        toast.error(res.error || t('error-downloading-pdf', 'Error downloading PDF'));
      }
    } catch (error) {
      toast.error(t('error-downloading-pdf', 'Error downloading PDF'));
      console.error('Error downloading PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShareWhatsApp = async () => {
    if (!savedInvoice) return;
    
    setIsSharing(true);
    toast.info('Please wait... Generating PDF for sharing');
    try {
      // Use sharing method that generates temporary PDF
      const res = await pdfAdapter.generateInvoicePdfForSharing?.({
        invoice: { ...savedInvoice, language: invoiceLanguage },
        companyName: appSettings.companyName,
        companyAddress: appSettings.companyAddress,
        companyPhone: appSettings.companyPhone,
        companyEmail: appSettings.companyEmail,
        gstNumber: appSettings.gstNumber,
        companyTagline: appSettings.companyTagline,
      }) || await pdfAdapter.generateInvoicePdf({
        invoice: { ...savedInvoice, language: invoiceLanguage },
        companyName: appSettings.companyName,
        companyAddress: appSettings.companyAddress,
        companyPhone: appSettings.companyPhone,
        companyEmail: appSettings.companyEmail,
        gstNumber: appSettings.gstNumber,
        companyTagline: appSettings.companyTagline,
      });
      const message = getWhatsAppMessage(
        { ...savedInvoice, language: invoiceLanguage }, 
        appSettings.companyName
      );

      if (res.success && res.filePath) {
        // Open native share sheet with message
        await shareAdapter.share({ 
          title: t('share-pdf', 'Share PDF'), 
          filePath: res.filePath, 
          type: 'application/pdf',
          message: message, // Pass the smart message (supported by some adapters/platforms)
        });
        toast.success(t('invoice-shared', 'Invoice shared!'));
        setTimeout(() => handleGoHome(), 1200); // Navigate to Dashboard after sharing
      } else {
        toast.error(res.error || t('error-sharing-invoice', 'Error sharing invoice'));
      }
    } catch (error) {
      toast.error(t('error-sharing-invoice', 'Error sharing invoice'));
      console.error('Error sharing invoice:', error);
    } finally {
      setIsSharing(false);
    }
  };


  // Dynamic Pricing Suggestion
  const pricingSuggestion = useDynamicPricing({
      name: details.name,
      phone: details.phone,
      address: details.address,
      customerType: details.customerType,
      gstNumber: details.gstNumber,
      // For demo, assume trustScore 85 if existing customer
      trustScore: details.phone ? 85 : 0 
  });

  return (
    <View style={styles.container}>
      {/* ... header ... */}
      
      {/* Dynamic Pricing Banner */}
      {step === 2 && pricingSuggestion && (
         <View style={{ backgroundColor: '#ecfdf5', padding: 10, margin: 16, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialIcons name="local-offer" size={20} color="#059669" />
            <View>
              <Text style={{ fontWeight: 'bold', color: '#047857' }}>{pricingSuggestion.label}</Text>
              <Text style={{ fontSize: 12, color: '#059669' }}>{pricingSuggestion.reason} applied automatically.</Text>
            </View>
         </View>
      )}

      <ScrollView contentContainerStyle={styles.content}>
        {step === 1 && (
          <View style={{ gap: spacing.md }}>
             <VoiceInvoiceInput onResult={onVoiceResult} />
            <CustomerDetailsStep
              value={details}
              onChange={setDetails}
              customers={customers as Customer[]}
              invoices={invoices as Invoice[]}
            />
            {errors.length > 0 && (
              <View style={styles.errorBox}>
                {errors.includes('invalid-phone') && (
                  <Text style={styles.errorText}>{t('enter-valid-phone', 'Enter a valid 10-digit phone')}</Text>
                )}
                {errors.includes('invalid-name') && (
                  <Text style={styles.errorText}>{t('enter-valid-name', 'Customer name is required')}</Text>
                )}
                {errors.includes('invalid-address') && (
                  <Text style={styles.errorText}>{t('enter-valid-address', 'Customer address is required')}</Text>
                )}
              </View>
            )}
            <Button onPress={onNextFromStep1} style={{ marginTop: 8 }}>{t('next')}</Button>
          </View>
        )}
        {step === 2 && (
          <View style={{ gap: spacing.md }}>
            <ServiceSelectionStep
              selected={services}
              onChange={setServices}
              available={serviceSets[details.customerType]}
            />
            {errors.includes('no-services') && (
              <View style={styles.errorBox}><Text style={styles.errorText}>{t('add-at-least-one-service')}</Text></View>
            )}
            <View style={styles.row}>
              <Button variant="secondary" onPress={onBackFromStep2} style={{ flex: 1 }}>{t('back')}</Button>
              <Button onPress={onNextFromStep2} style={{ flex: 1 }}>{t('next')}</Button>
            </View>
          </View>
        )}
        {step === 3 && (
          <View style={{ gap: spacing.md }}>
            <FinancialsStep value={financials} onChange={setFinancials} />
            <View style={styles.row}>
              <Button variant="secondary" onPress={onBackFromStep3} style={{ flex: 1 }}>{t('back')}</Button>
              <Button onPress={onNextFromStep3} style={{ flex: 1 }}>{t('preview-invoice')}</Button>
            </View>
          </View>
        )}
        {step === 4 && previewData && (
          <View style={styles.step4Container}>
            <UnifiedInvoicePreview
              invoiceData={previewData}
              language={invoiceLanguage}
              company={{
                name: appSettings.companyName,
                tagline: appSettings.companyTagline,
                address: appSettings.companyAddress,
                phone: appSettings.companyPhone,
                email: appSettings.companyEmail,
                gstNumber: appSettings.gstNumber,
              }}
            />
            <View style={styles.row}>
              <Button variant="secondary" onPress={onBackFromStep4} style={{ flex: 1 }} icon={<MaterialIcons name="edit" size={16} color={colors.text} />}>
                {t('edit-details')}
              </Button>
              <Button 
                onPress={savedInvoice ? handleUpdateInvoice : handleSaveInvoice} 
                style={{ flex: 1 }} 
                loading={isProcessing} 
                icon={<MaterialIcons name="attach-money" size={16} color={colors.white} />}
              >
                {isProcessing ? t('processing', 'Processing...') : (savedInvoice ? t('update-invoice', 'Update Invoice') : t('save-and-continue'))}
              </Button>
            </View>
          </View>
        )}
        {step === 5 && savedInvoice && (
          <PaymentCollectionStep
            savedInvoice={savedInvoice}
            appSettings={{
              upiId: appSettings.upiId,
              companyName: appSettings.companyName,
              companyTagline: appSettings.companyTagline,
              companyAddress: appSettings.companyAddress,
              companyPhone: appSettings.companyPhone,
              companyEmail: appSettings.companyEmail,
              gstNumber: appSettings.gstNumber,
            }}
            onCollectPayment={handleCollectPayment}
            onSkipPayment={handleSkipPayment}
            onDownload={handleDownloadPdf}
            onShareWhatsApp={handleShareWhatsApp}
            onGoHome={handleGoHome}
            isProcessing={isProcessing}
            isDownloading={isDownloading}
            isSharing={isSharing}
            paymentCollected={paymentCollected}
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  title: { ...typography.h3, color: colors.text, marginBottom: spacing.sm, paddingHorizontal: spacing.md, paddingTop: spacing.md },
  placeholder: { ...typography.bodySmall, color: colors.textSecondary, padding: spacing.md },
  progress: { height: 8, backgroundColor: colors.surface, marginHorizontal: spacing.md, borderRadius: 999, overflow: 'hidden', marginBottom: spacing.sm, justifyContent: 'center' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 999 },
  progressLabelContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressLabel: {
    ...typography.caption,
    color: colors.white,
    fontWeight: 'bold',
  },
  primaryButton: { backgroundColor: colors.primary, padding: spacing.md, borderRadius: 10, alignItems: 'center' },
  primaryButtonText: { ...typography.body, color: colors.white, fontWeight: '600' },
  errorBox: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.error, borderRadius: 8, padding: spacing.sm },
  errorText: { ...typography.caption, color: colors.error },
  row: { flexDirection: 'row', gap: spacing.md },
  secondaryButton: { backgroundColor: colors.surface, padding: spacing.md, borderRadius: 10, alignItems: 'center' },
  secondaryButtonText: { ...typography.body, color: colors.primary, fontWeight: '600' },
  step4Container: { gap: spacing.md, alignItems: 'center' }, // Added style for centering preview
});
