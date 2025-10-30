import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Platform, ScrollView, Switch, Image } from 'react-native'; // FIX: Imported Image
import { Picker } from '@react-native-picker/picker';
import type { Invoice, CustomerType, Service, Customer, ServiceSets, ManageableService, PaymentMethod, PendingOrder, AppSettings, Payment, Language } from '../types';
import { Card, Button, Icon, Modal } from './Common';
import { InvoicePreview } from './InvoicePreview';
import { downloadPDF, generatePdfAsFile } from '../services/pdfService'; // These now trigger native Alerts
import { useToast } from '../hooks/useToast';
import { calculateRemainingBalance } from '../hooks/useInvoices';
import { PhoneNumberInput } from './PhoneNumberInput';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';


interface InvoiceFormPageProps {
    onSave: (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'invoiceDate'>) => Promise<Invoice>;
    onUpdatePayment: (invoiceId: number, amount: number, method: PaymentMethod) => Promise<Invoice | null>;
    onComplete: () => void;
    existingInvoice: Invoice | null; // Note: existingInvoice is always null for new invoice form.
    customers: Customer[];
    serviceSets: ServiceSets;
    invoices: Invoice[];
    pendingOrder: PendingOrder | null;
    appSettings: AppSettings;
}

const customerTypes: CustomerType[] = ['customer', 'garage_service_station', 'dealer'];

interface InvoiceLanguageToggleProps {
  value: Language;
  onChange: (lang: Language) => void;
  isDarkMode: boolean;
}

const InvoiceLanguageToggle: React.FC<InvoiceLanguageToggleProps> = ({ value, onChange, isDarkMode }) => {
    const { t } = useLanguage();
    return (
        <View style={[styles.langToggleContainer, isDarkMode ? styles.bgSlate700 : styles.bgSlate200]}>
            <TouchableOpacity onPress={() => onChange('en')} style={[styles.langToggleButton, value === 'en' && (isDarkMode ? styles.langToggleActiveDark : styles.langToggleActiveLight)]}>
                <Text style={styles.langToggleButtonText}>{t('english')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onChange('kn')} style={[styles.langToggleButton, value === 'kn' && (isDarkMode ? styles.langToggleActiveDark : styles.langToggleActiveLight)]}>
                <Text style={styles.langToggleButtonText}>{t('kannada')}</Text>
            </TouchableOpacity>
        </View>
    );
};

export const InvoiceFormPage: React.FC<InvoiceFormPageProps> = ({ onSave, onUpdatePayment, onComplete, customers, serviceSets, invoices, pendingOrder, appSettings }) => {
    const toast = useToast();
    const { t } = useLanguage();
    const { resolvedTheme } = useTheme();
    const isDarkMode = resolvedTheme === 'dark';
    const [step, setStep] = useState(1);
    
    const [customer, setCustomer] = useState({ name: '', phone: '', address: '' });
    const [customerType, setCustomerType] = useState<CustomerType>('customer');
    const [selectedServices, setSelectedServices] = useState<Service[]>([]);
    const [isCustomServiceModalOpen, setIsCustomServiceModalOpen] = useState(false);
    const [newCustomService, setNewCustomService] = useState({ name: '', price: 0 });
    const [showOldBalance, setShowOldBalance] = useState(false);
    const [oldBalance, setOldBalance] = useState({ amount: 0, date: '' });
    const [showAdvancePaid, setShowAdvancePaid] = useState(false);
    const [advancePaid, setAdvancePaid] = useState({ amount: 0, date: '' });
    
    const [previewData, setPreviewData] = useState<Invoice | null>(null);
    const [invoiceLanguage, setInvoiceLanguage] = useState<Language>('en');

    const [savedInvoice, setSavedInvoice] = useState<Invoice | null>(null);
    const [paymentCollected, setPaymentCollected] = useState(false);
    const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
    const [nowPaid, setNowPaid] = useState({ amount: 0, method: 'cash' as PaymentMethod });


     useEffect(() => {
        if (pendingOrder) {
            setCustomer({
                name: pendingOrder.customerName,
                phone: pendingOrder.customerPhone,
                address: pendingOrder.customerAddress,
            });
            setCustomerType(pendingOrder.customerType);
            setSelectedServices(pendingOrder.services);
            if (pendingOrder.advancePaid.amount > 0) {
                setShowAdvancePaid(true);
                setAdvancePaid({ amount: pendingOrder.advancePaid.amount, date: pendingOrder.orderDate });
            }
        }
    }, [pendingOrder]);

    useEffect(() => {
        if (customer.phone.length === 10) {
            const existingCustomer = customers.find((c: Customer) => c.phone === customer.phone);
            if (existingCustomer) {
                setCustomer(prev => ({
                    ...prev,
                    name: existingCustomer.name,
                    address: existingCustomer.address,
                }));

                const totalArrears = invoices
                    .filter(inv => inv.customerPhone === customer.phone)
                    .reduce((total, inv) => {
                        const balance = calculateRemainingBalance(inv);
                        return balance > 0 ? total + balance : total;
                    }, 0);

                if (totalArrears > 0) {
                    setShowOldBalance(true);
                    setOldBalance({ amount: Math.round(totalArrears), date: '' });
                } else {
                    setShowOldBalance(false);
                    setOldBalance({ amount: 0, date: '' });
                }

            } else {
                setShowOldBalance(false);
                setOldBalance({ amount: 0, date: '' });
            }
        }
    }, [customer.phone, customers, invoices]);
    
    useEffect(() => {
        if (!pendingOrder) {
            setSelectedServices([]);
        }
    }, [customerType, pendingOrder]);

    const handleNext = useCallback(() => {
        if (step === 1) {
            if (!customer.name || customer.phone.length !== 10) {
                toast.error("Please provide a valid customer name and 10-digit phone number.");
                return;
            }
        }
        if (step === 2) {
             const finalServices = selectedServices.filter(s => s.name && s.price > 0 && s.quantity > 0);
             if (finalServices.length === 0) {
                toast.error(t('add-at-least-one-service', 'Please add at least one goods or service.'));
                return;
            }
        }
        setStep(prev => prev + 1);
    }, [step, customer.name, customer.phone, selectedServices, toast, t]);

    const handleBack = useCallback(() => setStep(prev => prev - 1), []);

    const handleGeneratePreview = useCallback(() => {
        const finalServices = selectedServices.filter(s => s.name && s.price > 0 && s.quantity > 0);
        const invoiceForPreview: Omit<Invoice, 'id' | 'invoiceNumber' | 'invoiceDate' | 'payments'> & { payments: Payment[] } = {
            customerName: customer.name,
            customerPhone: customer.phone,
            customerAddress: customer.address || 'N/A',
            customerType: customerType,
            services: finalServices,
            oldBalance: showOldBalance && oldBalance.amount > 0 ? oldBalance : undefined,
            advancePaid: showAdvancePaid && advancePaid.amount > 0 ? advancePaid : undefined,
            payments: [],
            language: invoiceLanguage,
        };
        setPreviewData({ ...invoiceForPreview, id: 0, invoiceNumber: 'PREVIEW', invoiceDate: new Date().toLocaleDateString("en-IN") });
        setStep(4);
    }, [selectedServices, customer, customerType, showOldBalance, oldBalance, showAdvancePaid, advancePaid, invoiceLanguage]);
    
    const handleSaveAndProceed = useCallback(async () => {
        if (!previewData) return;
        try {
            const saved = await onSave(previewData);
            setSavedInvoice(saved);
            // Set nowPaid amount to the *newly calculated* remaining balance after saving
            setNowPaid(prev => ({ ...prev, amount: calculateRemainingBalance(saved) }));
            setStep(5);
        } catch (error) {
            toast.error("Failed to save invoice.");
        }
    }, [previewData, onSave, toast]);

    const handleCollectPayment = useCallback(async () => {
        if (!savedInvoice || nowPaid.amount <= 0) {
            toast.error("Please enter a valid amount to collect.");
            return;
        }
        setIsSubmittingPayment(true);
        try {
            const updatedInvoice = await onUpdatePayment(savedInvoice.id, nowPaid.amount, nowPaid.method);
            if(updatedInvoice) {
                setSavedInvoice(updatedInvoice);
                setPaymentCollected(true);
                toast.success(t('payment-recorded-successfully'));
            } else {
                throw new Error("Failed to update invoice with payment.");
            }
        } catch (error) {
            toast.error("Failed to record payment.");
        } finally {
            setIsSubmittingPayment(false);
        }
    }, [savedInvoice, nowPaid, onUpdatePayment, toast, t]);

    const handleServiceQuantityChange = useCallback((index: number, newQuantity: string) => {
        const parsedQuantity = parseInt(newQuantity, 10);
        setSelectedServices(prev => {
            const newServices = [...prev];
            if (newServices[index]) {
                newServices[index].quantity = Math.max(1, parsedQuantity || 0);
            }
            return newServices;
        });
    }, []);

    const handleAddCustomServiceFromModal = useCallback(() => {
        if (!newCustomService.name || newCustomService.price <= 0) {
            toast.error(t('valid-service-name-price', 'Please enter a valid goods/service name and price.'));
            return;
        }
        const serviceToAdd: Service = { ...newCustomService, quantity: 1, isCustom: true };
        setSelectedServices(prev => [...prev, serviceToAdd]);
        setNewCustomService({ name: '', price: 0 });
        setIsCustomServiceModalOpen(false);
    }, [newCustomService, toast, t]);

    const handleSelectPredefinedService = useCallback((service: ManageableService) => {
        setSelectedServices(prev => {
            if (prev.some(s => s.name === service.name && !s.isCustom)) {
                return prev;
            }
            return [...prev, { ...service, quantity: 1, isCustom: false }];
        });
    }, []);

    const handleRemoveService = useCallback((index: number) => {
        setSelectedServices(prev => prev.filter((_, i) => i !== index));
    }, []);
    
    // In React Native, PDF functionality is stubbed out.
    const handleDownload = async (invoiceToDownload: Invoice) => {
        // Calling stubbed function in pdfService.ts
        await downloadPDF(invoiceToDownload);
    };

    // In React Native, WhatsApp sharing functionality is stubbed out.
    const handleShareWhatsApp = async () => {
        Alert.alert(
            'WhatsApp Share Unavailable',
            'Direct WhatsApp sharing of generated PDFs is not yet supported in the native app version. Please use the web version for this feature.',
            [{ text: 'OK' }]
        );
    };

    const renderStep1 = () => (
        <Card style={styles.cardPadding}>
            <Text style={[styles.cardTitle, isDarkMode ? styles.textLight : styles.textDark]}>{t('customer-details')}</Text>
            <View style={styles.formSection}>
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, isDarkMode ? styles.textSlate300 : styles.textSlate700]}>{t('customer-phone')}</Text>
                    <PhoneNumberInput value={customer.phone} onChange={phone => setCustomer({ ...customer, phone })} isDarkMode={isDarkMode} />
                </View>
                 <View style={styles.inputGroup}>
                    <Text style={[styles.label, isDarkMode ? styles.textSlate300 : styles.textSlate700]}>{t('customer-name')}</Text>
                    <TextInput 
                        placeholder={t('customer-name')} 
                        value={customer.name} 
                        onChangeText={name => setCustomer({ ...customer, name })} 
                        style={[styles.input, isDarkMode ? styles.inputDark : styles.inputLight]}
                        placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
                    />
                </View>
                 <View style={styles.inputGroup}>
                    <Text style={[styles.label, isDarkMode ? styles.textSlate300 : styles.textSlate700]}>{t('customer-address')}</Text>
                    <TextInput 
                        placeholder={t('customer-address')} 
                        value={customer.address} 
                        onChangeText={address => setCustomer({ ...customer, address })} 
                        style={[styles.input, isDarkMode ? styles.inputDark : styles.inputLight]} 
                        placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
                    />
                </View>
                <View>
                    <Text style={[styles.label, styles.mb2, isDarkMode ? styles.textSlate300 : styles.textSlate700]}>{t('customer-type')}</Text>
                    <View style={styles.radioGroup}>
                        {customerTypes.map(type => (
                            <TouchableOpacity key={type} onPress={() => setCustomerType(type)} style={styles.radioOption}>
                                <View style={[styles.radioButton, customerType === type && styles.radioSelected]}>
                                    {customerType === type && <View style={styles.radioInner} />}
                                </View>
                                <Text style={isDarkMode ? styles.textLight : styles.textDark}>{t(type)}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
            <View style={styles.buttonDivider}>
                <Button onPress={handleNext} style={styles.fullWidthButton}>{t('next')}</Button>
            </View>
        </Card>
    );

    const renderStep2 = () => {
        const availableServices = serviceSets[customerType]?.filter(
            ps => !selectedServices.some(ss => ss.name === ps.name && !ss.isCustom)
        ) || [];

        return (
            <Card style={styles.cardPadding}>
                <Text style={[styles.cardTitle, isDarkMode ? styles.textLight : styles.textDark]}>{t('services-and-items')}</Text>
                <View style={styles.serviceListContainer}>
                    {selectedServices.length === 0 && <Text style={[styles.noServicesText, isDarkMode ? styles.textSlate400 : styles.textSlate500]}>{t('no-services-added')}</Text>}
                    {selectedServices.map((service, index) => (
                        <View key={index} style={[styles.serviceItem, isDarkMode ? styles.serviceItemDark : styles.serviceItemLight]}>
                            <View style={styles.serviceDetails}>
                                <Text style={[styles.serviceName, isDarkMode ? styles.textLight : styles.textDark]}>{t(service.name)}</Text>
                                <Text style={[styles.servicePrice, isDarkMode ? styles.textSlate400 : styles.textSlate500]}>{t('price-label')} ₹{service.price}</Text>
                            </View>
                            <View style={styles.serviceQuantityControl}>
                                <Text style={[styles.qtyLabel, isDarkMode ? styles.textLight : styles.textDark]}>{t('qty-label')}</Text>
                                <TextInput
                                    style={[styles.qtyInput, isDarkMode ? styles.inputDark : styles.inputLight]}
                                    keyboardType="numeric"
                                    value={service.quantity.toString()}
                                    onChangeText={(text) => handleServiceQuantityChange(index, text)}
                                />
                            </View>
                            <TouchableOpacity onPress={() => handleRemoveService(index)} style={styles.removeServiceButton} accessibilityLabel={t('delete-service-aria', 'Delete goods/service')}>
                                <Icon name="trash" size={20} style={styles.removeServiceIcon} />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

                <View style={[styles.addServiceSection, isDarkMode ? styles.borderSlate700 : styles.borderSlate200]}>
                    <Text style={[styles.addServicesHeader, isDarkMode ? styles.textLight : styles.textDark]}>{t('add-services')}</Text>
                    <View style={styles.predefinedServices}>
                        {availableServices.map(service => (
                            <TouchableOpacity key={service.name} onPress={() => handleSelectPredefinedService(service)} style={[styles.predefinedServiceButton, isDarkMode ? styles.predefinedServiceButtonDark : styles.predefinedServiceButtonLight]}>
                                <Text style={[styles.predefinedServiceButtonText, isDarkMode ? styles.predefinedServiceButtonTextDark : styles.predefinedServiceButtonTextLight]}>+ {t(service.name)}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <Button onPress={() => setIsCustomServiceModalOpen(true)} variant="secondary" style={styles.fullWidthButton}>
                        <Icon name="plus" size={20} style={isDarkMode ? styles.iconDark : styles.iconLight} />
                        <Text>{t('add-custom-service')}</Text>
                    </Button>
                </View>

                <View style={styles.bottomNavigation}>
                    <Button onPress={handleBack} variant="secondary"><Text>{t('back')}</Text></Button>
                    <Button onPress={handleNext}><Text>{t('next')}</Text></Button>
                </View>
            </Card>
        );
    };
    
    const renderStep3 = () => (
        <Card style={styles.cardPadding}>
            <Text style={[styles.cardTitle, isDarkMode ? styles.textLight : styles.textDark]}>{t('financials')}</Text>
            <View style={styles.financialsGrid}>
                <View style={[styles.financialOptionCard, isDarkMode ? styles.financialOptionCardDark : styles.financialOptionCardLight]}>
                   <TouchableOpacity onPress={() => setShowOldBalance(prev => !prev)} style={styles.checkboxRow}>
                        <View style={[styles.checkbox, showOldBalance && styles.checkboxChecked]}>
                            {showOldBalance && <Icon name="check" size={12} style={styles.checkboxCheckIcon} />}
                        </View>
                        <Text style={[styles.fontMedium, isDarkMode ? styles.textLight : styles.textDark]}>{t('old-balance-arrears')}</Text>
                   </TouchableOpacity>
                   {showOldBalance && <View style={styles.spaceY2}>
                       <TextInput 
                           style={[styles.input, isDarkMode ? styles.inputDark : styles.inputLight]} 
                           keyboardType="numeric"
                           value={oldBalance.amount === 0 ? '' : oldBalance.amount.toString()} 
                           onChangeText={text => setOldBalance({ ...oldBalance, amount: parseFloat(text) || 0 })} 
                           placeholder={t('amount-placeholder')} 
                           placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
                       />
                       <TextInput 
                           style={[styles.input, isDarkMode ? styles.inputDark : styles.inputLight]} 
                           value={oldBalance.date} 
                           onChangeText={date => setOldBalance({ ...oldBalance, date })} 
                           placeholder={t('date-placeholder', 'YYYY-MM-DD')} // Add date placeholder
                           placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
                           keyboardType="number-pad"
                       />
                    </View>}
                </View>
                <View style={[styles.financialOptionCard, isDarkMode ? styles.financialOptionCardDark : styles.financialOptionCardLight]}>
                   <TouchableOpacity onPress={() => setShowAdvancePaid(prev => !prev)} style={styles.checkboxRow}>
                       <View style={[styles.checkbox, showAdvancePaid && styles.checkboxChecked]}>
                            {showAdvancePaid && <Icon name="check" size={12} style={styles.checkboxCheckIcon} />}
                       </View>
                       <Text style={[styles.fontMedium, isDarkMode ? styles.textLight : styles.textDark]}>{t('advance-paid')}</Text>
                   </TouchableOpacity>
                   {showAdvancePaid && <View style={styles.spaceY2}>
                       <TextInput 
                           style={[styles.input, isDarkMode ? styles.inputDark : styles.inputLight]} 
                           keyboardType="numeric"
                           value={advancePaid.amount === 0 ? '' : advancePaid.amount.toString()} 
                           onChangeText={text => setAdvancePaid({ ...advancePaid, amount: parseFloat(text) || 0 })} 
                           placeholder={t('amount-placeholder')} 
                           placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
                       />
                       <TextInput 
                           style={[styles.input, isDarkMode ? styles.inputDark : styles.inputLight]} 
                           value={advancePaid.date} 
                           onChangeText={date => setAdvancePaid({ ...advancePaid, date })} 
                           placeholder={t('date-placeholder', 'YYYY-MM-DD')} 
                           placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
                           keyboardType="number-pad"
                       />
                   </View>}
                </View>
            </View>
            <View style={styles.bottomNavigation}>
                <Button onPress={handleBack} variant="secondary"><Text>{t('back')}</Text></Button>
                <Button onPress={handleGeneratePreview}><Text>{t('preview-invoice')}</Text></Button>
            </View>
        </Card>
    );

    const renderStep4 = () => (
        <View style={styles.previewStepContainer}>
            <View style={styles.invoiceLanguageToggleWrapper}>
                 <InvoiceLanguageToggle value={invoiceLanguage} onChange={setInvoiceLanguage} isDarkMode={isDarkMode} />
            </View>
            <View style={[styles.invoicePreviewWrapper, isDarkMode ? styles.bgSlate800 : styles.bgSlate200]}>
                {previewData && <InvoicePreview invoiceData={previewData} language={invoiceLanguage} />}
            </View>
             <View style={[styles.step4BottomButtons, isDarkMode ? styles.borderSlate700 : styles.borderSlate200]}>
                <Button onPress={handleBack} variant="secondary" style={styles.fullWidthButton}>
                    <Icon name="pencil" size={20} style={isDarkMode ? styles.iconDark : styles.iconLight}/> <Text>{t('edit-details')}</Text>
                </Button>
                <View style={styles.step4ActionButtons}>
                    <Button onPress={handleSaveAndProceed} style={styles.fullWidthButton}>
                        <Icon name="banknotes" size={20} style={isDarkMode ? styles.iconDark : styles.iconLight}/> <Text>{t('save-and-continue')}</Text>
                    </Button>
                </View>
            </View>
        </View>
    );

    const renderStep5 = () => {
        if (!savedInvoice) return null;

        const balanceDue = calculateRemainingBalance(savedInvoice);

        const generateQrCodeUrl = () => {
            if (!appSettings.upiId || !nowPaid.amount || nowPaid.amount <= 0) return null;
            const payeeName = "VOS WASH";
            const upiUrl = `upi://pay?pa=${appSettings.upiId}&pn=${encodeURIComponent(payeeName)}&am=${nowPaid.amount}&cu=INR`;
            return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}`;
        };

        const qrCodeUrl = generateQrCodeUrl();

        return (
             <Card style={styles.cardPadding}>
                 <Text style={[styles.cardTitle, isDarkMode ? styles.textLight : styles.textDark, styles.pb2]}>
                    {paymentCollected ? t('actions') : t('collect-payment')}
                </Text>
                <View style={styles.centerText}>
                    <Text style={[styles.textSlate500, isDarkMode ? styles.textSlate400 : styles.textSlate500]}>{t('invoice-for').replace('{invoiceNumber}', savedInvoice.invoiceNumber).replace('{customerName}', savedInvoice.customerName)}</Text>
                    <Text style={[styles.balanceDueAmount, isDarkMode ? styles.textLight : styles.textDark]}>₹{balanceDue.toFixed(2)}</Text>
                </View>

                {!paymentCollected ? (
                     <View style={styles.spaceY4}>
                        <View>
                            <Text style={[styles.label, styles.mb1, isDarkMode ? styles.textSlate300 : styles.textSlate700]}>{t('enter-amount')}</Text>
                            <TextInput 
                                style={[styles.input, isDarkMode ? styles.inputDark : styles.inputLight]} 
                                keyboardType="numeric"
                                value={nowPaid.amount === 0 ? '' : nowPaid.amount.toString()}
                                onChangeText={(text) => setNowPaid(p => ({ ...p, amount: parseFloat(text) || 0 }))}
                            />
                        </View>
                        <View>
                            <Text style={[styles.label, styles.mb1, isDarkMode ? styles.textSlate300 : styles.textSlate700]}>{t('payment-method')}</Text>
                            <View style={[styles.pickerWrapper, isDarkMode ? styles.inputDark : styles.inputLight]}>
                                <Picker
                                    selectedValue={nowPaid.method}
                                    onValueChange={(itemValue) => setNowPaid(p => ({ ...p, method: itemValue as PaymentMethod }))}
                                    style={isDarkMode ? styles.pickerDark : styles.pickerLight}
                                    dropdownIconColor={isDarkMode ? '#f8fafc' : '#1e293b'} // Picker dropdown icon color
                                >
                                    <Picker.Item label={t('cash')} value="cash" />
                                    <Picker.Item label={t('upi')} value="upi" />
                                </Picker>
                            </View>
                        </View>
                        {nowPaid.method === 'upi' && (
                        <View style={[styles.qrCodeSection, isDarkMode ? styles.qrCodeSectionDark : styles.qrCodeSectionLight]}>
                            {qrCodeUrl ? (
                            <>
                                <Text style={[styles.qrCodeText, isDarkMode ? styles.textSlate400 : styles.textSlate600]}>{t('scan-to-pay', 'Scan to pay ₹{amount}').replace('{amount}', nowPaid.amount.toString())}</Text> {/* FIX: Added qrCodeText to styles */}
                                <Image source={{ uri: qrCodeUrl }} style={styles.qrCodeImage} />
                                <Text style={[styles.upiIdText, isDarkMode ? styles.textLight : styles.textDark]}>{appSettings.upiId}</Text>
                            </>
                            ) : (
                            <View style={styles.noQrCodeWrapper}>
                                <Text style={[styles.noQrCodeText, isDarkMode ? styles.textSlate400 : styles.textSlate500]}>{t('enter-valid-amount-qr')}</Text> {/* FIX: Added noQrCodeText to styles */}
                            </View>
                            )}
                        </View>
                        )}
                        <View style={styles.buttonDivider}>
                            <Button onPress={handleCollectPayment} disabled={isSubmittingPayment} style={styles.collectPaymentButton}>
                                <Text>{isSubmittingPayment ? t('processing') : t('confirm-collection')}</Text>
                            </Button>
                        </View>
                    </View>
                ) : (
                    <View style={styles.actionsPostPayment}>
                         {/* Hidden Invoice Preview for PDF generation */}
                         <View style={[styles.invoicePreviewHidden, isDarkMode ? styles.bgSlate800 : styles.bgSlate200]}>
                            <InvoicePreview invoiceData={savedInvoice} language={savedInvoice.language} />
                        </View>
                        <Text style={[styles.paymentRecordedMessage, isDarkMode ? styles.textLight : styles.textDark]}>{t('payment-recorded-successfully')}</Text>
                        <View style={styles.actionButtonsPostPayment}>
                             <Button onPress={() => handleDownload(savedInvoice)} variant="secondary" style={styles.actionButtonPost}>
                                <Icon name="document-duplicate" size={20} style={isDarkMode ? styles.iconDark : styles.iconLight}/> <Text>{t('download-pdf')}</Text>
                            </Button>
                             <Button onPress={handleShareWhatsApp} style={styles.whatsappButton}>
                                <Icon name="whatsapp" size={20} style={styles.whatsappIcon}/> <Text>{t('share-on-whatsapp')}</Text>
                            </Button>
                        </View>
                         <Button onPress={onComplete}><Text>{t('finish-and-go-to-invoices')}</Text></Button>
                    </View>
                )}
            </Card>
        );
    };

    return (
        <ScrollView style={styles.pageContainer} contentContainerStyle={styles.pageContent}>
            <View style={[styles.progressBarBackground, isDarkMode ? styles.bgSlate700 : styles.bgSlate200]}>
                <View style={[styles.progressBarFill, { width: `${(step / 5) * 100}%` }]}></View> {/* FIX: Changed divisor to 5 as there are 5 steps */}
            </View>

            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
            {step === 5 && renderStep5()}
            
            <Modal isOpen={isCustomServiceModalOpen} onClose={() => setIsCustomServiceModalOpen(false)} title={t('add-custom-service')}>
                <View style={styles.modalContent}>
                     <TextInput 
                        placeholder={t('service-name-placeholder', 'Goods/Service Name')} 
                        value={newCustomService.name} 
                        onChangeText={text => setNewCustomService(p => ({ ...p, name: text }))} 
                        style={[styles.input, isDarkMode ? styles.inputDark : styles.inputLight]} 
                        placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
                    />
                     <TextInput 
                        placeholder={t('price-placeholder')} 
                        keyboardType="numeric"
                        value={newCustomService.price === 0 ? '' : newCustomService.price.toString()} 
                        onChangeText={text => setNewCustomService(p => ({ ...p, price: parseFloat(text) || 0 }))} 
                        style={[styles.input, isDarkMode ? styles.inputDark : styles.inputLight]} 
                        placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
                    />
                     <View style={styles.modalButtons}>
                        <Button onPress={() => setIsCustomServiceModalOpen(false)} variant="secondary"><Text>{t('cancel')}</Text></Button>
                        <Button onPress={handleAddCustomServiceFromModal}><Text>{t('add-services')}</Text></Button>
                     </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    pageContainer: {
        flex: 1,
    },
    pageContent: {
        paddingBottom: 24, // space-y-6
    },
    progressBarBackground: {
        width: '100%', // w-full
        borderRadius: 9999, // rounded-full
        height: 10, // h-2.5
        marginBottom: 24, // space-y-6
    },
    bgSlate200: { backgroundColor: '#e2e8f0' },
    bgSlate700: { backgroundColor: '#334155' },

    progressBarFill: {
        backgroundColor: '#4f46e5', // bg-indigo-600
        height: '100%',
        borderRadius: 9999, // rounded-full
        // transitionProperty: 'width', // transition
        // transitionDuration: 300, // duration-300
        // transitionTimingFunction: 'ease-in-out', // ease-in-out
    },
    
    cardPadding: {
        padding: 24, // p-6 md:p-8
    },
    cardTitle: {
        fontSize: 18, // text-lg
        fontWeight: 'bold',
        marginBottom: 16, // mb-4
        paddingBottom: 8, // pb-2
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0', // border-b-slate-200
    },
    textLight: { color: '#f8fafc' }, // dark:text-slate-100
    textDark: { color: '#1e293b' }, // text-slate-800
    textSlate300: { color: '#cbd5e1' }, // dark:text-slate-300
    textSlate700: { color: '#475569' }, // text-slate-700
    textSlate400: { color: '#94a3b8' }, // FIX: Defined local color styles
    textSlate500: { color: '#64748b' }, // FIX: Defined local color styles
    textSlate600: { color: '#475569' }, // FIX: Defined local color styles

    pb2: { paddingBottom: 8 }, // pb-2

    formSection: {
        gap: 16, // grid grid-cols-1 gap-4
    },
    inputGroup: {
        gap: 8, // space-y-2
    },
    label: {
        fontSize: 14, // text-sm
        fontWeight: '500', // font-medium
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16, // px-4
        paddingVertical: 12, // py-3
        fontSize: 16, // text-base
        width: '100%', // block w-full
    },
    inputLight: {
        borderColor: '#cbd5e1', // border-slate-300
        backgroundColor: '#ffffff', // bg-white
        color: '#1e293b', // text-slate-800
    },
    inputDark: {
        borderColor: '#475569', // dark:border-slate-600
        backgroundColor: '#0f172a', // dark:bg-slate-900
        color: '#f8fafc', // dark:text-slate-200
    },
    mb2: { marginBottom: 8 }, // mb-2
    radioGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16, // gap-4
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    radioButton: {
        height: 16, // h-4
        width: 16, // w-4
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#cbd5e1', // border-slate-300
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8, // mr-2
    },
    radioSelected: {
        borderColor: '#4f46e5', // text-indigo-600 focus:ring-indigo-500
    },
    radioInner: {
        height: 8,
        width: 8,
        borderRadius: 4,
        backgroundColor: '#4f46e5', // Inner dot color
    },
    buttonDivider: {
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0', // border-t-slate-200
        marginTop: 24, // mt-6
        paddingTop: 24, // pt-6
        // dark:border-slate-700
    },
    fullWidthButton: {
        width: '100%',
        paddingVertical: 12, // !py-3
    },
    iconDark: { color: '#e2e8f0' }, // dark:text-slate-100
    iconLight: { color: '#1e293b' }, // text-slate-800

    // Step 2
    serviceListContainer: {
        gap: 12, // space-y-3 mb-6
        marginBottom: 24,
    },
    noServicesText: {
        textAlign: 'center',
        paddingVertical: 16, // py-4
    },
    serviceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8, // gap-2
        padding: 8, // p-2
        borderRadius: 6, // rounded-md
    },
    serviceItemLight: {
        backgroundColor: '#f8fafc', // bg-slate-50
    },
    serviceItemDark: {
        backgroundColor: 'rgba(30, 41, 59, 0.5)', // dark:bg-slate-800/50
    },
    serviceDetails: {
        flexGrow: 1,
    },
    serviceName: {
        fontWeight: 'bold', // font-semibold
    },
    servicePrice: {
        fontSize: 14, // text-sm
    },
    serviceQuantityControl: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8, // gap-2
    },
    qtyLabel: {
        fontSize: 14, // text-sm
        fontWeight: '500', // font-medium
    },
    qtyInput: {
        width: 60, // w-20
        paddingHorizontal: 12, // px-3
        paddingVertical: 8, // py-2
        fontSize: 16, // text-base
        borderRadius: 8, // rounded-lg
        borderWidth: 1,
        textAlign: 'center',
    },
    removeServiceButton: {
        padding: 8, // p-2
        borderRadius: 9999, // rounded-full
        // hover:bg-red-100 dark:hover:bg-red-900/20
    },
    removeServiceIcon: {
        color: '#ef4444', // text-red-500
    },
    addServiceSection: {
        borderTopWidth: 1,
        paddingTop: 16, // pt-4
    },
    borderSlate200: { borderColor: '#e2e8f0' },
    borderSlate700: { borderColor: '#334155' },
    addServicesHeader: {
        fontWeight: 'bold', // font-semibold
        marginBottom: 8, // mb-2
    },
    predefinedServices: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8, // gap-2 mb-4
        marginBottom: 16,
    },
    predefinedServiceButton: {
        paddingHorizontal: 12, // px-3
        paddingVertical: 6, // py-1.5
        borderRadius: 9999, // rounded-full
    },
    predefinedServiceButtonLight: {
        backgroundColor: '#e2e8f0', // bg-slate-200
    },
    predefinedServiceButtonDark: {
        backgroundColor: '#334155', // dark:bg-slate-700
    },
    predefinedServiceButtonText: {
        fontSize: 14, // text-sm
    },
    predefinedServiceButtonTextLight: {
        color: '#1e293b', // default
    },
    predefinedServiceButtonTextDark: {
        color: '#f8fafc', // dark
    },
    bottomNavigation: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 16, // gap-4
        marginTop: 24, // mt-6
        borderTopWidth: 1,
        paddingTop: 24, // pt-6
        // dark:border-slate-700
    },

    // Step 3
    financialsGrid: {
        flexDirection: 'column', // grid grid-cols-1 md:grid-cols-2 gap-6
        gap: 24, // gap-6
    },
    financialOptionCard: {
        padding: 16, // p-4
        borderRadius: 8, // rounded-lg
        borderWidth: 1,
        gap: 8, // space-y-2 for inputs
    },
    financialOptionCardLight: {
        backgroundColor: '#f8fafc', // bg-slate-50
        borderColor: '#e2e8f0', // border-slate-200
    },
    financialOptionCardDark: {
        backgroundColor: 'rgba(30, 41, 59, 0.5)', // dark:bg-slate-800/50
        borderColor: '#334155', // dark:border-slate-700
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8, // mb-2
    },
    checkbox: {
        height: 20,
        width: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#4f46e5', // text-indigo-600
        marginRight: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#4f46e5',
    },
    checkboxCheckIcon: {
        color: '#ffffff', // text-white
        fontSize: 12, // Adjust size to fit checkbox
    },
    fontMedium: {
        fontWeight: '500', // font-medium
    },
    spaceY2: {
        gap: 8, // space-y-2
    },

    // Step 4
    previewStepContainer: {
        flex: 1,
    },
    invoiceLanguageToggleWrapper: {
        alignItems: 'center',
        marginBottom: 16, // mb-4
    },
    langToggleContainer: {
        flexDirection: 'row',
        padding: 4, // p-1
        borderRadius: 8, // rounded-lg
    },
    langToggleButton: {
        paddingHorizontal: 16, // px-4
        paddingVertical: 6, // py-1.5
        borderRadius: 6, // rounded-md
        // transition - activeOpacity handles it
    },
    langToggleButtonText: {
        fontSize: 14,
    },
    langToggleActiveDark: {
        backgroundColor: '#1e293b', // dark:bg-slate-800 shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 2,
    },
    langToggleActiveLight: {
        backgroundColor: '#ffffff', // bg-white shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 2,
    },
    invoicePreviewWrapper: {
        padding: 16, // p-4 sm:p-8
        borderRadius: 8, // rounded-lg
        marginBottom: 24, // mb-6
    },
    bgSlate800: { backgroundColor: '#1e293b' },
    step4BottomButtons: {
        flexDirection: 'column', // flex flex-col sm:flex-row gap-4
        gap: 16, // gap-4
        borderTopWidth: 1,
        paddingTop: 24, // pt-6
        // justify-between
    },
    step4ActionButtons: {
        flexDirection: 'row',
        gap: 16, // gap-4
        flexGrow: 1, // To make them stretch evenly
    },

    // Step 5
    centerText: {
        alignItems: 'center', // text-center
        marginBottom: 24, // mb-6
    },
    balanceDueAmount: {
        fontSize: 30, // text-3xl
        fontWeight: 'bold',
        marginTop: 8, // mt-2
    },
    spaceY4: {
        gap: 16, // space-y-4
    },
    mb1: { marginBottom: 4 }, // mb-1
    pickerWrapper: {
        borderWidth: 1,
        borderRadius: 8,
        overflow: 'hidden',
    },
    pickerLight: {
        backgroundColor: '#ffffff', // bg-white
        color: '#1e293b', // text-slate-800
    },
    pickerDark: {
        backgroundColor: '#0f172a', // dark:bg-slate-900
        color: '#f8fafc', // dark:text-slate-200
    },
    qrCodeSection: {
        padding: 16, // p-4
        borderRadius: 8, // rounded-lg
        alignItems: 'center',
    },
    qrCodeSectionLight: {
        backgroundColor: '#f8fafc', // bg-slate-50
        borderColor: '#e2e8f0', // border-slate-200
        borderWidth: 1,
    },
    qrCodeSectionDark: {
        backgroundColor: 'rgba(15, 23, 42, 0.5)', // dark:bg-slate-900/50
        borderColor: '#334155', // dark:border-slate-700
        borderWidth: 1,
    },
    qrCodeText: { // FIX: Added qrCodeText style
        fontSize: 12, // text-sm
        color: '#475569', // text-slate-600
        marginBottom: 8, // mb-2
    },
    qrCodeImage: {
        width: 192, // w-48 h-48
        height: 192,
        borderRadius: 8, // rounded-lg
        resizeMode: 'contain',
    },
    upiIdText: {
        marginTop: 8, // mt-2
        fontWeight: '600', // font-semibold
    },
    noQrCodeWrapper: {
        height: 192 + 16, // Match QR code image height + some margin
        justifyContent: 'center',
        alignItems: 'center',
    },
    noQrCodeText: { // FIX: Added noQrCodeText style
        color: '#64748b', // text-slate-500
        height: 240, // Match QR code image height for centering
        textAlignVertical: 'center',
    },
    collectPaymentButton: {
        width: '100%',
    },
    actionsPostPayment: {
        gap: 24, // space-y-6
    },
    invoicePreviewHidden: {
        position: 'absolute', // Hide the preview off-screen
        left: -9999,
        width: 1,
        height: 1,
        overflow: 'hidden',
    },
    paymentRecordedMessage: {
        fontSize: 18, // text-lg
        fontWeight: '600', // font-semibold
        textAlign: 'center',
    },
    actionButtonsPostPayment: {
        flexDirection: 'column', // flex flex-col sm:flex-row gap-4
        gap: 16, // gap-4
    },
    actionButtonPost: {
        flex: 1, // Make buttons equal width on row (if row)
    },
    whatsappButton: {
        backgroundColor: '#25d366', // bg-whatsapp-green (custom color if needed, else green-600)
        flex: 1,
    },
    whatsappIcon: {
        color: '#ffffff', // text-white
    },

    // Modal for custom service
    modalContent: {
        gap: 16, // space-y-4
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12, // gap-3
        paddingTop: 8, // pt-2
    },
});