import React, { useState, useEffect } from 'react';
import type { Service, Customer, ServiceSets, ManageableService, CustomerType, AppSettings, PendingOrder } from '../types';
import { Card, Button, Icon, Modal } from './Common';
import { CUSTOMER_TYPE_LABELS } from '../constants';
import { useToast } from '../hooks/useToast';

interface OrderFormPageProps {
    onSave: (orderData: Omit<PendingOrder, 'id'>) => void;
    customers: Customer[];
    serviceSets: ServiceSets;
    appSettings: AppSettings;
}

export const OrderFormPage: React.FC<OrderFormPageProps> = ({ onSave, customers, serviceSets, appSettings }) => {
    const toast = useToast();
    const [step, setStep] = useState(1);
    
    // Step 1 State
    const [customer, setCustomer] = useState({ name: '', phone: '', address: '' });
    const [customerType, setCustomerType] = useState<CustomerType>('customer');

    // Step 2 State
    const [selectedServices, setSelectedServices] = useState<Service[]>([]);
    const [isCustomServiceModalOpen, setIsCustomServiceModalOpen] = useState(false);
    const [newCustomService, setNewCustomService] = useState({ name: '', price: 0 });

    // Step 3 State
    const [advancePaid, setAdvancePaid] = useState({ amount: 0 });

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
                toast.error("Please add at least one service.");
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
        };
        onSave(orderData);
        toast.success("Order saved successfully! It can be converted to an invoice from the dashboard.");
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
            toast.error("Please enter a valid service name and price.");
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
                return prev; // Already added
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
            <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100 border-b pb-2 dark:border-slate-700">Customer Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <input type="tel" placeholder="Customer Phone (10 digits)" value={customer.phone} onChange={e => setCustomer({ ...customer, phone: e.target.value.replace(/\D/g, '') })} maxLength={10} className="block w-full px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900" />
                <input type="text" placeholder="Customer Name" value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} className="block w-full px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900" />
                <div className="md:col-span-2">
                    <input type="text" placeholder="Customer Address (Optional)" value={customer.address} onChange={e => setCustomer({ ...customer, address: e.target.value })} className="block w-full px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900" />
                </div>
                <div className="md:col-span-2">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Customer Type</p>
                    <div className="flex flex-wrap gap-4">
                        {(Object.keys(CUSTOMER_TYPE_LABELS) as CustomerType[]).map(type => (
                            <label key={type} className="flex items-center">
                                <input type="radio" name="customerType" value={type} checked={customerType === type} onChange={() => setCustomerType(type)} className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:bg-slate-700 dark:border-slate-500"/>
                                {CUSTOMER_TYPE_LABELS[type]}
                            </label>
                        ))}
                    </div>
                </div>
            </div>
            <div className="border-t pt-6 dark:border-slate-700">
                <Button onClick={handleNext} className="w-full !py-3">Next</Button>
            </div>
        </Card>
    );

    const renderStep2 = () => {
        const availableServices = serviceSets[customerType]?.filter(
            ps => !selectedServices.some(ss => ss.name === ps.name && !ss.isCustom)
        ) || [];

        return (
            <Card className="p-6 md:p-8">
                <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100 border-b pb-2 dark:border-slate-700">Services & Items</h3>
                <div className="space-y-3 mb-6">
                    {selectedServices.length === 0 && <p className="text-center text-slate-500 py-4">No services added yet.</p>}
                    {selectedServices.map((service, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 rounded-md bg-slate-50 dark:bg-slate-800/50">
                            <div className="flex-grow">
                                <p className="font-semibold">{service.name}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Price: ₹{service.price}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <label htmlFor={`qty-${index}`} className="text-sm font-medium">Qty:</label>
                                <input
                                    type="number"
                                    id={`qty-${index}`}
                                    value={service.quantity}
                                    min="1"
                                    onChange={(e) => handleServiceQuantityChange(index, parseInt(e.target.value, 10))}
                                    className="block w-20 px-3 py-2 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900"
                                />
                            </div>
                            <button onClick={() => handleRemoveService(index)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full" aria-label="Delete service">
                                <Icon name="trash" className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="border-t dark:border-slate-700 pt-4">
                    <h4 className="font-semibold mb-2">Add Services</h4>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {availableServices.map(service => (
                            <button key={service.name} onClick={() => handleSelectPredefinedService(service)} className="px-3 py-1.5 text-sm bg-slate-200 dark:bg-slate-700 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600">
                                + {service.name}
                            </button>
                        ))}
                    </div>
                    <Button onClick={() => setIsCustomServiceModalOpen(true)} variant="secondary" className="w-full">
                        <Icon name="plus" className="w-5 h-5" />
                        Add Custom Service/Item
                    </Button>
                </div>

                <div className="flex justify-between gap-4 mt-6 border-t pt-6 dark:border-slate-700">
                    <Button onClick={handleBack} variant="secondary">Back</Button>
                    <Button onClick={handleNext}>Next</Button>
                </div>
            </Card>
        );
    };
    
    const renderStep3 = () => {
        const qrCodeUrl = generateQrCodeUrl();
        return (
            <Card className="p-6 md:p-8">
                <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100 border-b pb-2 dark:border-slate-700">Advance Payment</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-4">
                         <label className="font-medium">Enter Advance Amount</label>
                         <input type="number" value={advancePaid.amount || ''} onChange={e => setAdvancePaid({ ...advancePaid, amount: parseFloat(e.target.value) || 0 })} placeholder="Amount (₹)" className="block w-full px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900" />
                         <p className="text-sm text-slate-500">A QR code will be generated for the customer to scan and pay.</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border dark:border-slate-700">
                        {qrCodeUrl ? (
                            <>
                                <img src={qrCodeUrl} alt="UPI QR Code" className="mx-auto rounded-lg" />
                                <p className="mt-2 font-semibold">{appSettings.upiId}</p>
                            </>
                        ) : (
                            <div className='flex flex-col items-center justify-center h-[250px]'>
                                <p className="text-slate-500">Enter an amount to generate QR code.</p>
                                <p className="text-xs text-slate-400 mt-2"> (Ensure UPI ID is set in Settings)</p>
                            </div>
                        )}
                    </div>
                </div>
                 <div className="flex justify-between gap-4 mt-6 border-t pt-6 dark:border-slate-700">
                    <Button onClick={handleBack} variant="secondary">Back</Button>
                    <Button onClick={handleSaveOrder} className="!bg-teal-600 hover:!bg-teal-700">Save Order</Button>
                </div>
            </Card>
        );
    }
    
    return (
        <div className="space-y-6">
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                <div className="bg-teal-500 h-2.5 rounded-full" style={{ width: `${(step / 3) * 100}%`, transition: 'width 0.3s ease-in-out' }}></div>
            </div>

            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            
            <Modal isOpen={isCustomServiceModalOpen} onClose={() => setIsCustomServiceModalOpen(false)} title="Add Custom Service">
                <div className="space-y-4">
                     <input type="text" placeholder="Service Name" value={newCustomService.name} onChange={e => setNewCustomService(p => ({ ...p, name: e.target.value }))} className="block w-full px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900" />
                     <input type="number" placeholder="Price (₹)" value={newCustomService.price || ''} onChange={e => setNewCustomService(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))} className="block w-full px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900" />
                     <div className="flex justify-end gap-3 pt-2">
                        <Button onClick={() => setIsCustomServiceModalOpen(false)} variant="secondary">Cancel</Button>
                        <Button onClick={handleAddCustomServiceFromModal}>Add Service</Button>
                     </div>
                </div>
            </Modal>
        </div>
    );
};