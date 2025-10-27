import React, { useState, useEffect } from 'react';
import type { Invoice, CustomerType, Service, Customer, ServiceSets, ManageableService, PaymentMethod } from '../types';
import { Card, Button, Icon } from './Common';
import { InvoicePreview } from './InvoicePreview';
import { CUSTOMER_TYPE_LABELS } from '../constants';
import { downloadPDF } from '../services/pdfService';
import { useToast } from '../hooks/useToast';

interface InvoiceFormPageProps {
    onSave: (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'invoiceDate'>) => void;
    existingInvoice: Invoice | null;
    customers: Customer[];
    serviceSets: ServiceSets;
}

export const InvoiceFormPage: React.FC<InvoiceFormPageProps> = ({ onSave, customers, serviceSets }) => {
    const toast = useToast();
    const [step, setStep] = useState(1);
    
    // Step 1 State
    const [customer, setCustomer] = useState({ name: '', phone: '', address: '' });
    const [customerType, setCustomerType] = useState<CustomerType>('customer');

    // Step 2 State
    const [selectedServices, setSelectedServices] = useState<Service[]>([]);
    
    const [showOldBalance, setShowOldBalance] = useState(false);
    const [oldBalance, setOldBalance] = useState({ amount: 0, date: '' });
    
    const [showAdvancePaid, setShowAdvancePaid] = useState(false);
    const [advancePaid, setAdvancePaid] = useState({ amount: 0, date: '' });

    const [showNowPaid, setShowNowPaid] = useState(false);
    const [nowPaid, setNowPaid] = useState({ amount: 0, method: 'cash' as PaymentMethod });

    const [previewData, setPreviewData] = useState<Invoice | null>(null);

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
    
    // Reset services when customer type changes in step 1
    useEffect(() => {
        if (step === 1) {
            setSelectedServices([]);
        }
    }, [customerType, step]);

    const handleNextStep = () => {
        if (!customer.name || customer.phone.length !== 10) {
            toast.error("Please provide a valid customer name and 10-digit phone number.");
            return;
        }
        setStep(2);
    };

    // --- Service Handlers for Step 2 ---
    const handleServiceToggle = (service: ManageableService) => {
        setSelectedServices(prev => 
            prev.some(s => s.name === service.name && !s.isCustom)
            ? prev.filter(s => !(s.name === service.name && !s.isCustom))
            : [...prev, { ...service, quantity: 1, isCustom: false }]
        );
    };

    const handleAddCustomService = () => {
        const newService: Service = { name: '', price: 0, quantity: 1, isCustom: true };
        setSelectedServices(prev => [...prev, newService]);
    };
    
    const handleCustomServiceChange = (index: number, field: 'name' | 'price' | 'quantity', value: string | number) => {
        setSelectedServices(prev => {
            const newServices = [...prev];
            const serviceToUpdate = newServices[index];
            if(serviceToUpdate) {
                (serviceToUpdate as any)[field] = value;
            }
            return newServices;
        });
    };
    
    const handleRemoveService = (index: number) => {
        setSelectedServices(prev => prev.filter((_, i) => i !== index));
    };


    const handleGeneratePreview = () => {
        const finalServices = selectedServices.filter(s => s.name && s.price > 0 && s.quantity > 0);

        if (!customer.name || customer.phone.length !== 10) {
            toast.error("Customer details are invalid.");
            setStep(1);
            return;
        }
        if (finalServices.length === 0) {
            toast.error("Please select or add at least one valid service.");
            return;
        }

        const invoiceForPreview: Invoice = {
            id: Date.now(),
            invoiceNumber: 'PREVIEW',
            invoiceDate: new Date().toLocaleDateString("en-IN"),
            customerName: customer.name,
            customerPhone: customer.phone,
            customerAddress: customer.address || 'N/A',
            customerType: customerType,
            services: finalServices,
            oldBalance: showOldBalance && oldBalance.amount > 0 ? oldBalance : undefined,
            advancePaid: showAdvancePaid && advancePaid.amount > 0 ? advancePaid : undefined,
            payments: showNowPaid && nowPaid.amount > 0 ? [{ ...nowPaid, date: new Date().toLocaleDateString("en-IN") }] : [],
        };
        setPreviewData(invoiceForPreview);
    };

    const handleFinalSave = () => {
        if (!previewData) return;
        onSave(previewData);
    };
    
    const handleDownload = async () => {
        if (!previewData) return;
        await downloadPDF(previewData, document.getElementById('invoice-preview-content'));
        toast.success('Invoice saved to your Downloads folder.');
    };
    
    const renderStep1 = () => (
        <Card className="p-6 md:p-8">
            <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100 border-b pb-2 dark:border-slate-700">Step 1: Customer Details</h3>
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
                <Button onClick={handleNextStep} className="w-full !py-3">Next: Select Services</Button>
            </div>
        </Card>
    );
    
    const renderStep2 = () => (
         <Card className="p-6 md:p-8">
            <div className="flex justify-between items-center mb-4 pb-2 border-b dark:border-slate-700">
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Step 2: Services & Financials</h3>
                <Button onClick={() => setStep(1)} variant="secondary">
                    <Icon name="arrow-left" className="w-5 h-5"/> Back
                </Button>
            </div>
            
            {/* Services */}
            <h4 className="font-bold text-md my-4 text-slate-700 dark:text-slate-200">Predefined Services for {CUSTOMER_TYPE_LABELS[customerType]}</h4>
            <div className="space-y-3 mb-6">
                {(serviceSets[customerType] || []).map((service) => (
                    <div key={service.name} className={`border dark:border-slate-600 p-3 rounded-lg flex justify-between items-center transition bg-slate-50 dark:bg-slate-800/50`}>
                        <label className="flex items-center font-medium">
                            <input type="checkbox" checked={selectedServices.some(s => s.name === service.name && !s.isCustom)} onChange={() => handleServiceToggle(service)} className="mr-3 h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:bg-slate-700 dark:border-slate-500"/>
                            {service.name}
                        </label>
                        <span className="text-slate-600 dark:text-slate-300">₹{service.price}</span>
                    </div>
                ))}
            </div>

            <h4 className="font-bold text-md my-4 text-slate-700 dark:text-slate-200">Custom Services</h4>
             <div className="space-y-3 mb-6">
                {selectedServices.map((service, index) => {
                    if (!service.isCustom) return null;
                    // Find the original index in the `selectedServices` array to update the correct one
                    const originalIndex = selectedServices.indexOf(service);
                    return (
                        <div key={originalIndex} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={service.name}
                                onChange={(e) => handleCustomServiceChange(originalIndex, 'name', e.target.value)}
                                placeholder="Service Name"
                                className="block w-0 flex-grow px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900"
                            />
                            <input
                                type="number"
                                value={service.price || ''}
                                onChange={(e) => handleCustomServiceChange(originalIndex, 'price', parseFloat(e.target.value) || 0)}
                                placeholder="Price"
                                className="block w-24 px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900"
                            />
                            <button onClick={() => handleRemoveService(originalIndex)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full" aria-label="Delete service">
                                <Icon name="trash" className="w-5 h-5" />
                            </button>
                        </div>
                    );
                })}
                <Button onClick={handleAddCustomService} variant="secondary" className="w-full mt-2">
                    <Icon name="plus" className="w-5 h-5" />
                    Add Custom Service
                </Button>
            </div>

            {/* Financial Details */}
            <h3 className="font-bold text-lg my-4 text-slate-800 dark:text-slate-100 border-t pt-4 dark:border-slate-700">Financial Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Old Balance */}
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border dark:border-slate-700">
                   <label className="flex items-center font-medium mb-3"><input type="checkbox" checked={showOldBalance} onChange={e => setShowOldBalance(e.target.checked)} className="mr-2 h-4 w-4 rounded text-red-600 focus:ring-red-500" /> Old Balance (Arrears)</label>
                   {showOldBalance && <div className="space-y-2"><input type="number" value={oldBalance.amount || ''} onChange={e => setOldBalance({ ...oldBalance, amount: parseFloat(e.target.value) || 0 })} placeholder="Amount (₹)" className="block w-full px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900" /><input type="date" value={oldBalance.date} onChange={e => setOldBalance({ ...oldBalance, date: e.target.value })} className="block w-full px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900" /></div>}
                </div>
                {/* Advance Paid */}
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border dark:border-slate-700">
                   <label className="flex items-center font-medium mb-3"><input type="checkbox" checked={showAdvancePaid} onChange={e => setShowAdvancePaid(e.target.checked)} className="mr-2 h-4 w-4 rounded text-green-600 focus:ring-green-500"/> Advance Paid</label>
                   {showAdvancePaid && <div className="space-y-2"><input type="number" value={advancePaid.amount || ''} onChange={e => setAdvancePaid({ ...advancePaid, amount: parseFloat(e.target.value) || 0 })} placeholder="Amount (₹)" className="block w-full px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900" /><input type="date" value={advancePaid.date} onChange={e => setAdvancePaid({ ...advancePaid, date: e.target.value })} className="block w-full px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900" /></div>}
                </div>
                {/* Now Paid */}
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border dark:border-slate-700">
                   <label className="flex items-center font-medium mb-3"><input type="checkbox" checked={showNowPaid} onChange={e => setShowNowPaid(e.target.checked)} className="mr-2 h-4 w-4 rounded text-blue-600 focus:ring-blue-500"/> Now Paid (Today)</label>
                   {showNowPaid && <div className="space-y-2"><input type="number" value={nowPaid.amount || ''} onChange={e => setNowPaid({ ...nowPaid, amount: parseFloat(e.target.value) || 0 })} placeholder="Amount (₹)" className="block w-full px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900" /><select value={nowPaid.method} onChange={e => setNowPaid({ ...nowPaid, method: e.target.value as PaymentMethod })} className="block w-full px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900"><option value="cash">Cash</option><option value="upi">UPI</option></select></div>}
                </div>
            </div>

            {/* Actions */}
            <div className="border-t pt-6 dark:border-slate-700">
                 <Button onClick={handleGeneratePreview} className="w-full !py-3">Generate & Preview Invoice</Button>
            </div>
        </Card>
    );

    return (
        <div className="space-y-6">
            <p className="text-slate-500 dark:text-slate-400">Follow the steps below to generate an invoice.</p>

            {step === 1 ? renderStep1() : renderStep2()}

            {previewData && (
                <div className="mt-8">
                    <h3 className="font-bold text-lg mb-4 text-center text-slate-800 dark:text-slate-100">Invoice Preview</h3>
                     <div className="p-4 sm:p-8 bg-slate-200 dark:bg-slate-800 rounded-lg">
                        <InvoicePreview invoiceData={previewData} />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 mt-6">
                        <Button onClick={handleFinalSave} className="w-full">
                            <Icon name="document-duplicate" className="w-5 h-5"/> Confirm & Save
                        </Button>
                        <Button onClick={handleDownload} variant="secondary" className="w-full">
                            <Icon name="document-duplicate" className="w-5 h-5"/> Download PDF
                        </Button>
                         <Button onClick={() => window.print()} variant="secondary" className="w-full print-hidden">
                            <Icon name="printer" className="w-5 h-5"/> Print
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};