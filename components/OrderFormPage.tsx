import React, { useState, useEffect } from 'react';
import type { Service, Customer, ServiceSets, ManageableService, CustomerType, AppSettings, PendingOrder } from '../types';
import { Card, Button, Icon, Modal } from './Common';
import { useToast } from '../hooks/useToast';
import { PhoneNumberInput } from './PhoneNumberInput';
import { useLanguage } from '../hooks/useLanguage';

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
    const [step, setStep] = useState(1);
    
    const [customer, setCustomer] = useState({ name: '', phone: '', address: '' });
    const [customerType, setCustomerType] = useState<CustomerType>('customer');
    const [selectedServices, setSelectedServices] = useState<Service[]>([]);
    const [isCustomServiceModalOpen, setIsCustomServiceModalOpen] = useState(false);
    const [newCustomService, setNewCustomService] = useState({ name: '', price: 0 });
    const [advancePaid, setAdvancePaid] = useState({ amount: 0, date: '' });
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

    const handleNext = () => {
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
    };

    const handleBack = () => setStep(prev => prev - 1);
    
    const handleSaveOrder = () => {
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
    };

    const handleServiceQuantityChange = (index: number, newQuantity: number) => {
        setSelectedServices(prev => {
            const newServices = [...prev];
            if (newServices[index]) {
                newServices[index].quantity = Math.max(1, newQuantity);
            }
            return newServices;
        });
    };

    const handleAddCustomServiceFromModal = () => {
        if (!newCustomService.name || newCustomService.price <= 0) {
            toast.error(t('valid-service-name-price', 'Please enter a valid goods/service name and price.'));
            return;
        }
        const serviceToAdd: Service = { ...newCustomService, quantity: 1, isCustom: true };
        setSelectedServices(prev => [...prev, serviceToAdd]);
        setNewCustomService({ name: '', price: 0 });
        setIsCustomServiceModalOpen(false);
    };

    const handleSelectPredefinedService = (service: ManageableService) => {
        setSelectedServices(prev => {
            if (prev.some(s => s.name === service.name && !s.isCustom)) {
                return prev;
            }
            return [...prev, { ...service, quantity: 1, isCustom: false }];
        });
    };

    const handleRemoveService = (index: number) => {
        setSelectedServices(prev => prev.filter((_, i) => i !== index));
    };
    
    const generateQrCodeUrl = () => {
        if (!appSettings.upiId || advancePaid.amount <= 0) return null;
        const upiUrl = `upi://pay?pa=${appSettings.upiId}&pn=VOS%20WASH&am=${advancePaid.amount}&cu=INR`;
        return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}`;
    };

    const renderStep1 = () => (
        <Card className="p-6 md:p-8">
            <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100 border-b pb-2 dark:border-slate-700">{t('customer-details')}</h3>
            <div className="grid grid-cols-1 gap-4">
                 <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Icon name="phone" className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        {t('customer-phone')}
                    </label>
                    <PhoneNumberInput value={customer.phone} onChange={phone => setCustomer({ ...customer, phone })} />
                </div>
                 <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Icon name="user" className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        {t('customer-name')}
                    </label>
                    <input type="text" placeholder={t('customer-name')} value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} className="block w-full px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900" />
                </div>
                 <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Icon name="map-pin" className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        {t('customer-address')}
                    </label>
                    <input type="text" placeholder={t('customer-address')} value={customer.address} onChange={e => setCustomer({ ...customer, address: e.target.value })} className="block w-full px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900" />
                </div>
                <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('customer-type')}</p>
                    <div className="flex flex-wrap gap-4">
                        {customerTypes.map(type => (
                            <label key={type} className="flex items-center">
                                <input type="radio" name="customerType" value={type} checked={customerType === type} onChange={() => setCustomerType(type)} className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:bg-slate-700 dark:border-slate-500"/>
                                {t(type)}
                            </label>
                        ))}
                    </div>
                </div>
            </div>
            <div className="border-t pt-6 dark:border-slate-700 mt-6">
                <Button onClick={handleNext} className="w-full py-3!">{t('next')}</Button>
            </div>
        </Card>
    );

    const renderStep2 = () => {
        const availableServices = serviceSets[customerType]?.filter(
            ps => !selectedServices.some(ss => ss.name === ps.name && !ss.isCustom)
        ) || [];

        return (
            <Card className="p-6 md:p-8">
                <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100 border-b pb-2 dark:border-slate-700">{t('services-and-items')}</h3>
                <div className="space-y-3 mb-6">
                    {selectedServices.length === 0 && <p className="text-center text-slate-500 py-4">{t('no-services-added')}</p>}
                    {selectedServices.map((service, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 rounded-md bg-slate-50 dark:bg-slate-800/50">
                            <div className="grow">
                                <p className="font-semibold">{t(service.name)}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{t('price-label')} ₹{service.price}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <label htmlFor={`qty-${index}`} className="text-sm font-medium">{t('qty-label')}</label>
                                <input
                                    type="number"
                                    id={`qty-${index}`}
                                    value={service.quantity}
                                    min="1"
                                    onChange={(e) => handleServiceQuantityChange(index, parseInt(e.target.value, 10))}
                                    className="block w-20 px-3 py-2 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900"
                                />
                            </div>
                            <button onClick={() => handleRemoveService(index)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full" aria-label={t('delete-service-aria', 'Delete goods/service')}>
                                <Icon name="trash" className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="border-t dark:border-slate-700 pt-4">
                    <h4 className="font-semibold mb-2">{t('add-services')}</h4>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {availableServices.map(service => (
                            <button
                                key={service.name}
                                onClick={() => handleSelectPredefinedService(service)}
                                className="px-3 py-1.5 text-sm bg-slate-200 dark:bg-slate-700 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                title={`${t(service.name)} - ₹${service.price}`}
                            >
                                {t(service.name)} (₹{service.price})
                            </button>
                        ))}
                    </div>
                    <Button onClick={() => setIsCustomServiceModalOpen(true)} variant="secondary" className="w-full">
                        <Icon name="plus" className="w-5 h-5" />
                        {t('add-custom-service')}
                    </Button>
                </div>

                <div className="flex justify-between gap-4 mt-6 border-t pt-6 dark:border-slate-700">
                    <Button onClick={handleBack} variant="secondary">{t('back')}</Button>
                    <Button onClick={handleNext}>{t('next')}</Button>
                </div>
            </Card>
        );
    };

    const renderStep3 = () => {
        const qrCodeUrl = generateQrCodeUrl();
        return (
            <Card className="p-6 md:p-8">
                <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100 border-b pb-2 dark:border-slate-700">{t('enter-advance-amount')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="advanceAmount" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('advance-paid')}</label>
                            <input
                                type="number"
                                id="advanceAmount"
                                value={advancePaid.amount || ''}
                                onChange={(e) => setAdvancePaid(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))}
                                className="block w-full px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900"
                                placeholder={t('amount-placeholder')}
                            />
                        </div>
                        <div>
                            <label htmlFor="advanceDate" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('advance-paid-date', 'Advance Paid Date')}</label>
                             <input
                                type="date"
                                id="advanceDate"
                                value={advancePaid.date}
                                onChange={(e) => setAdvancePaid(p => ({ ...p, date: e.target.value }))}
                                className="block w-full px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900"
                            />
                        </div>
                        <div>
                            <label htmlFor="dueDate" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('promised-delivery-date')}</label>
                             <input
                                type="date"
                                id="dueDate"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="block w-full px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900"
                            />
                        </div>
                        <div>
                             <label className="flex items-center font-medium">
                                <input type="checkbox" checked={isUrgent} onChange={e => setIsUrgent(e.target.checked)} className="mr-2 h-4 w-4 rounded text-red-600 focus:ring-red-500" /> 
                                {t('urgent-order')}
                            </label>
                        </div>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border dark:border-slate-700 text-center">
                        {qrCodeUrl ? (
                            <>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{t('scan-to-pay', 'Scan to pay ₹{amount}').replace('{amount}', advancePaid.amount.toString())}</p>
                                <img src={qrCodeUrl} alt="UPI QR Code" className="mx-auto rounded-lg w-48 h-48" />
                                <p className="mt-2 font-semibold text-slate-800 dark:text-slate-200">{appSettings.upiId}</p>
                                <p className="text-xs text-slate-500 mt-1">{t('ensure-upi-id-set')}</p>
                            </>
                        ) : (
                            <div className="h-full flex items-center justify-center">
                                <p className="text-slate-500">{t('enter-valid-amount-qr')}</p>
                            </div>
                        )}
                    </div>
                </div>
                 <div className="flex justify-between gap-4 mt-6 border-t pt-6 dark:border-slate-700">
                    <Button onClick={handleBack} variant="secondary">{t('back')}</Button>
                    <Button onClick={handleSaveOrder}>{t('save-order')}</Button>
                </div>
            </Card>
        );
    };

    return (
        <div className="space-y-6">
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${(step / 3) * 100}%`, transition: 'width 0.3s ease-in-out' }}></div>
            </div>

            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            
            <Modal isOpen={isCustomServiceModalOpen} onClose={() => setIsCustomServiceModalOpen(false)} title={t('add-custom-service')}>
                <div className="space-y-4">
                     <input type="text" placeholder={t('service-name-placeholder', 'Goods/Service Name')} value={newCustomService.name} onChange={e => setNewCustomService(p => ({ ...p, name: e.target.value }))} className="block w-full px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900" />
                     <input type="number" placeholder={t('price-placeholder')} value={newCustomService.price || ''} onChange={e => setNewCustomService(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))} className="block w-full px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900" />
                     <div className="flex justify-end gap-3 pt-2">
                        <Button onClick={() => setIsCustomServiceModalOpen(false)} variant="secondary">{t('cancel')}</Button>
                        <Button onClick={handleAddCustomServiceFromModal}>{t('add-services')}</Button>
                     </div>
                </div>
            </Modal>
        </div>
    );
};