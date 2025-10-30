import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Platform, ScrollView, Switch, Image } from 'react-native'; // FIX: Imported Image
import { Picker } from '@react-native-picker/picker';
import type { Service, Customer, ServiceSets, ManageableService, CustomerType, AppSettings, PendingOrder } from '../types';
import { Card, Button, Icon, Modal } from './Common';
import { useToast } from '../hooks/useToast';
import { PhoneNumberInput } from './PhoneNumberInput';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';

interface OrderFormPageProps {
    onSave: (orderData: Omit<PendingOrder, 'id'>) => void;
    customers: Customer[];
    serviceSets: ServiceSets;
    appSettings: AppSettings;
}

const customerTypes: CustomerType[] = ['customer', 'garage_service_station', 'dealer'];

export const OrderFormPage: React.FC<OrderFormPageProps> = ({ onSave, customers, serviceSets, appSettings }) => {
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
    const [advancePaid, setAdvancePaid] = useState({ amount: 0 });
    const [dueDate, setDueDate] = useState('');
    const [isUrgent, setIsUrgent] = useState(false);

    useEffect(() => {
        if (customer.phone.length === 10) {
            const existingCustomer = customers.find((c: Customer) => c.phone === customer.phone);
            if (existingCustomer) {
                setCustomer({
                    ...customer,
                    name: existingCustomer.name,
                    address: existingCustomer.address,
                });
            }
        }
    }, [customer.phone, customers]);
    
    useEffect(() => {
        setSelectedServices([]);
    }, [customerType]);

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
    
    const handleSaveOrder = useCallback(() => {
        if (advancePaid.amount <= 0) {
            toast.error("Please enter an advance payment amount.");
            return;
        }
        const finalServices = selectedServices.filter(s => s.name && s.price > 0 && s.quantity > 0);
        const orderData: Omit<PendingOrder, 'id'> = {
            orderDate: new Date().toLocaleDateString("en-IN"),
            customerName: customer.name,
            customerPhone: customer.phone,
            customerAddress: customer.address || 'N/A',
            customerType: customerType,
            services: finalServices,
            advancePaid: advancePaid,
            dueDate: dueDate,
            isUrgent: isUrgent,
        };
        onSave(orderData);
        toast.success(t('order-saved-successfully'));
    }, [advancePaid, selectedServices, customer, customerType, dueDate, isUrgent, onSave, toast, t]);

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
    
    const generateQrCodeUrl = useCallback(() => {
        if (!appSettings.upiId || advancePaid.amount <= 0) return null;
        const upiUrl = `upi://pay?pa=${appSettings.upiId}&pn=VOS%20WASH&am=${advancePaid.amount}&cu=INR`;
        return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}`;
    }, [appSettings.upiId, advancePaid.amount]);

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
                    {selectedServices.length === 0 && <Text style={styles.noServicesText}>{t('no-services-added')}</Text>}
                    {selectedServices.map((service, index) => (
                        <View key={index} style={styles.serviceItem}>
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
                                    // FIX: Removed min="1" as it's a web attribute
                                />
                            </View>
                            <TouchableOpacity onPress={() => handleRemoveService(index)} style={styles.removeServiceButton} accessibilityLabel={t('delete-service-aria', 'Delete goods/service')}>
                                <Icon name="trash" size={20} style={styles.removeServiceIcon} />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

                <View style={styles.addServiceSection}>
                    <Text style={[styles.addServicesHeader, isDarkMode ? styles.textLight : styles.textDark]}>{t('add-services')}</Text>
                    <View style={styles.predefinedServices}>
                        {availableServices.map(service => (
                            <TouchableOpacity key={service.name} onPress={() => handleSelectPredefinedService(service)} style={[styles.predefinedServiceButton, isDarkMode ? styles.bgSlate700 : styles.bgSlate200]}>
                                <Text style={[styles.predefinedServiceButtonText, isDarkMode ? styles.textLight : styles.textDark]}>+ {t(service.name)}</Text>
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

    const renderStep3 = () => {
        const qrCodeUrl = generateQrCodeUrl();
        return (
            <Card style={styles.cardPadding}>
                <Text style={[styles.cardTitle, isDarkMode ? styles.textLight : styles.textDark]}>{t('enter-advance-amount')}</Text>
                <View style={styles.financialsGrid}>
                    <View style={styles.formColumn}>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, isDarkMode ? styles.textSlate300 : styles.textSlate700]}>{t('advance-paid')}</Text>
                            <TextInput
                                keyboardType="numeric"
                                value={advancePaid.amount === 0 ? '' : advancePaid.amount.toString()}
                                onChangeText={(text) => setAdvancePaid({ amount: parseFloat(text) || 0 })}
                                style={[styles.input, isDarkMode ? styles.inputDark : styles.inputLight]}
                                placeholder={t('amount-placeholder')}
                                placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, isDarkMode ? styles.textSlate300 : styles.textSlate700]}>{t('promised-delivery-date')}</Text>
                             <TextInput
                                value={dueDate}
                                onChangeText={setDueDate}
                                style={[styles.input, isDarkMode ? styles.inputDark : styles.inputLight]}
                                placeholder={t('date-placeholder', 'YYYY-MM-DD')} // Use a placeholder for format
                                placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
                                keyboardType="number-pad" // Hint for date input
                            />
                        </View>
                        <View style={styles.urgentToggleContainer}>
                             <Switch value={isUrgent} onValueChange={setIsUrgent} />
                             <Text style={[styles.urgentToggleText, isDarkMode ? styles.textLight : styles.textDark]}>{t('urgent-order')}</Text>
                        </View>
                    </View>
                    
                    <View style={[styles.qrCodeCard, isDarkMode ? styles.qrCodeCardDark : styles.qrCodeCardLight]}>
                        {qrCodeUrl ? (
                            <>
                                <Text style={[styles.qrCodeText, isDarkMode ? styles.textSlate400 : styles.textSlate600]}>{t('scan-to-pay', 'Scan to pay ₹{amount}').replace('{amount}', advancePaid.amount.toString())}</Text>
                                <Image source={{ uri: qrCodeUrl }} style={styles.qrCodeImage} />
                                <Text style={[styles.upiIdText, isDarkMode ? styles.textSlate200 : styles.textSlate800]}>{appSettings.upiId}</Text>
                                <Text style={[styles.ensureUpiText, isDarkMode ? styles.textSlate500 : styles.textSlate500]}>{t('ensure-upi-id-set')}</Text>
                            </>
                        ) : (
                            <View style={styles.noQrCodeMessageContainer}>
                                <Text style={[styles.noQrCodeText, isDarkMode ? styles.textSlate500 : styles.textSlate500]}>{t('enter-valid-amount-qr')}</Text>
                            </View>
                        )}
                    </View>
                </View>
                 <View style={styles.bottomNavigation}>
                    <Button onPress={handleBack} variant="secondary"><Text>{t('back')}</Text></Button>
                    <Button onPress={handleSaveOrder}><Text>{t('save-order')}</Text></Button>
                </View>
            </Card>
        );
    };

    return (
        <ScrollView style={styles.pageContainer} contentContainerStyle={styles.pageContent}>
            <View style={[styles.progressBarBackground, isDarkMode ? styles.bgSlate700 : styles.bgSlate200]}>
                <View style={[styles.progressBarFill, { width: `${(step / 3) * 100}%` }]}></View>
            </View>

            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            
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
    bgSlate200: { backgroundColor: '#e2e8f0' }, // bg-slate-200
    bgSlate700: { backgroundColor: '#334155' }, // dark:bg-slate-700

    progressBarFill: {
        backgroundColor: '#4f46e5', // bg-indigo-600
        height: '100%',
        borderRadius: 9999, // rounded-full
        // transition: 'width 0.3s ease-in-out' - handled by layout system, no explicit transition property
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
        color: '#64748b', // text-slate-500
        paddingVertical: 16, // py-4
    },
    serviceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8, // gap-2
        padding: 8, // p-2
        borderRadius: 6, // rounded-md
        backgroundColor: '#f8fafc', // bg-slate-50
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
        borderTopColor: '#e2e8f0', // border-t-slate-200
        paddingTop: 16, // pt-4
    },
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
        // bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600
    },
    predefinedServiceButtonText: {
        fontSize: 14, // text-sm
        color: '#1e293b', // Default
    },
    bottomNavigation: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 16, // gap-4
        marginTop: 24, // mt-6
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0', // dark:border-slate-700
        paddingTop: 24, // pt-6
    },

    // Step 3
    financialsGrid: {
        flexDirection: 'column', // grid grid-cols-1 md:grid-cols-2 gap-6
        gap: 24, // gap-6
    },
    formColumn: {
        gap: 16, // space-y-4
    },
    urgentToggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8, // mr-2
        marginTop: 16, // mt-4
    },
    urgentToggleText: {
        fontSize: 16, // text-base
        fontWeight: '500', // font-medium
    },
    qrCodeCard: {
        padding: 16, // p-4
        borderRadius: 8, // rounded-lg
        alignItems: 'center',
        justifyContent: 'center', // for centering no QR message
    },
    qrCodeCardLight: {
        backgroundColor: '#f8fafc', // bg-slate-50
        borderColor: '#e2e8f0', // border-slate-200
        borderWidth: 1,
    },
    qrCodeCardDark: {
        backgroundColor: 'rgba(15, 23, 42, 0.5)', // dark:bg-slate-900/50
        borderColor: '#334155', // dark:border-slate-700
        borderWidth: 1,
    },
    qrCodeText: {
        fontSize: 14, // text-sm
        marginBottom: 8, // mb-2
        textAlign: 'center',
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
        textAlign: 'center',
    },
    textSlate200: { color: '#e2e8f0' },
    textSlate800: { color: '#1e293b' },

    ensureUpiText: {
        fontSize: 12, // text-xs
        marginTop: 4, // mt-1
        textAlign: 'center',
    },
    noQrCodeMessageContainer: {
        height: 192 + 16, // Match QR code image height + some margin
        justifyContent: 'center',
        alignItems: 'center',
    },
    noQrCodeText: {
        fontSize: 14,
        textAlign: 'center',
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