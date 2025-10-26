import React, { useState, useEffect } from 'react';
import type { Invoice, CustomerType, Service, Customer, ServiceSets, ManageableService, PaymentMethod } from '../types';
import { PageHeader, Card, Button, Icon } from './Common';
import { InvoicePreview } from './InvoicePreview';

interface InvoiceFormPageProps {
    onSave: (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'invoiceDate'>, initialPayment?: { amount: number, method: PaymentMethod }) => void;
    existingInvoice: Invoice | null;
    customers: Customer[];
    serviceSets: ServiceSets;
}

export const InvoiceFormPage: React.FC<InvoiceFormPageProps> = (props) => {
    const [step, setStep] = useState(1);
    
    // Form State
    const [customer, setCustomer] = useState<{ name: string; phone: string; address: string }>({ name: '', phone: '', address: '' });
    const [customerType, setCustomerType] = useState<CustomerType>('customer');
    const [selectedServices, setSelectedServices] = useState<Service[]>([]);
    const [initialPayment, setInitialPayment] = useState({ amount: 0, method: 'cash' as PaymentMethod });

    const [previewData, setPreviewData] = useState<Invoice | null>(null);

    const handleGeneratePreview = () => {
        const invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'invoiceDate' | 'payments'> & { payments: any[] } = {
            customerName: customer.name, 
            customerPhone: customer.phone, 
            customerAddress: customer.address || "N/A",
            customerType, 
            services: selectedServices,
            payments: [],
        };

        const finalInvoiceDataForPreview: Invoice = {
            ...invoiceData,
            id: props.existingInvoice?.id || Date.now(),
            invoiceNumber: props.existingInvoice?.invoiceNumber || "PREVIEW",
            invoiceDate: new Date().toLocaleDateString("en-IN"),
            payments: initialPayment.amount > 0 ? [{...initialPayment, date: new Date().toLocaleDateString("en-IN")}] : []
        }

        setPreviewData(finalInvoiceDataForPreview);
        setStep(4);
    };

    const handleFinalSave = () => {
        const invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'invoiceDate'> = {
            customerName: customer.name, 
            customerPhone: customer.phone, 
            customerAddress: customer.address || "N/A",
            customerType, 
            services: selectedServices,
            payments: [], // payments will be added by App.tsx
        };
        props.onSave(invoiceData, initialPayment);
    };

    const renderStep = () => {
        switch (step) {
            case 1: return <CustomerStep customers={props.customers} customer={customer} setCustomer={setCustomer} setCustomerType={setCustomerType} customerType={customerType} nextStep={() => setStep(2)} />;
            case 2: return <ServicesStep serviceSets={props.serviceSets} customerType={customerType} selectedServices={selectedServices} setSelectedServices={setSelectedServices} prevStep={() => setStep(1)} nextStep={() => setStep(3)} />;
            case 3: return <PaymentStep initialPayment={initialPayment} setInitialPayment={setInitialPayment} prevStep={() => setStep(2)} onGenerate={handleGeneratePreview} />;
            case 4: return <PreviewStep invoice={previewData!} onSave={handleFinalSave} onEdit={() => setStep(1)} />;
            default: return null;
        }
    };
    
    const pageTitle = props.existingInvoice ? "Edit Invoice" : "Create New Invoice";
    const pageSubtitle = step < 4 ? `Step ${step} of 3` : 'Step 4: Preview & Confirm';

    return (
        <div>
            <PageHeader title={pageTitle} subtitle={pageSubtitle} />
            <div className="max-w-3xl mx-auto">{renderStep()}</div>
             <style>{`.form-input { @apply block w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900; }`}</style>
        </div>
    );
};

// --- Sub-components for each step ---

const CustomerStep = ({ customers, customer, setCustomer, setCustomerType, customerType, nextStep }: any) => {

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
    }, [customer.phone, customers, setCustomer]);


    return (
        <Card className="p-6 md:p-8">
            <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">Customer Details</h3>
            <div className="space-y-4">
                 <input type="tel" placeholder="Customer Phone (10 digits)" value={customer.phone} onChange={e => setCustomer({ ...customer, phone: e.target.value.replace(/\D/g, '')})} maxLength={10} className="form-input" />
                <input type="text" placeholder="Customer Name" value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} className="form-input" />
                <input type="text" placeholder="Customer Address (Optional)" value={customer.address} onChange={e => setCustomer({ ...customer, address: e.target.value })} className="form-input" />
                <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Customer Type</p>
                    <div className="flex flex-wrap gap-4">
                        {(['customer', 'garage', 'dealer'] as CustomerType[]).map(type => (
                            <label key={type} className="flex items-center capitalize"><input type="radio" name="customerType" value={type} checked={customerType === type} onChange={() => setCustomerType(type)} className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:bg-slate-700 dark:border-slate-500"/>{type}</label>
                        ))}
                    </div>
                </div>
            </div>
            <Button onClick={nextStep} disabled={!customer.name || customer.phone.length !== 10} className="mt-6 w-full">Next: Select Services</Button>
        </Card>
    );
};

const ServicesStep = ({ serviceSets, customerType, selectedServices, setSelectedServices, prevStep, nextStep }: any) => {
    
    const currentServiceSet = serviceSets[customerType] || [];

    const handleToggle = (service: ManageableService) => {
        setSelectedServices((prev: Service[]) => prev.find(s => s.name === service.name) ? prev.filter(s => s.name !== service.name) : [...prev, { ...service, quantity: 1 }]);
    };
    const handleQuantityChange = (name: string, quantity: number) => {
        setSelectedServices((prev: Service[]) => prev.map(s => s.name === name ? { ...s, quantity: Math.max(1, quantity) } : s));
    };

    return (
         <Card className="p-6 md:p-8">
            <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">Select Services for <span className="capitalize text-indigo-600 dark:text-indigo-400">{customerType}</span></h3>
            <div className="space-y-3">
                {currentServiceSet.map((service: ManageableService) => {
                    const isSelected = selectedServices.some((s: Service) => s.name === service.name);
                    const currentService = selectedServices.find((s: Service) => s.name === service.name);
                    return (
                        <div key={service.name} className={`border dark:border-slate-700 p-3 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-2 transition ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
                            <label className="flex items-center font-medium"><input type="checkbox" checked={isSelected} onChange={() => handleToggle(service)} className="mr-3 h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:bg-slate-700 dark:border-slate-500"/>{service.name}</label>
                            <div className="flex items-center gap-2 self-end sm:self-center">
                               <span className="text-slate-600 dark:text-slate-300">₹{service.price}</span>
                               {isSelected && <input type="number" value={currentService?.quantity} onChange={e => handleQuantityChange(service.name, parseInt(e.target.value) || 1)} className="w-16 text-center border-slate-300 dark:border-slate-600 rounded-md p-1 bg-white dark:bg-slate-700" />}
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="flex gap-4 mt-6">
                 <Button onClick={prevStep} variant="secondary" className="w-full">Back</Button>
                 <Button onClick={nextStep} disabled={selectedServices.length === 0} className="w-full">Next: Payment Details</Button>
            </div>
        </Card>
    );
};

const PaymentStep = ({ initialPayment, setInitialPayment, prevStep, onGenerate }: any) => {
    return (
        <Card className="p-6 md:p-8">
             <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">Initial Payment (Optional)</h3>
             <div className="space-y-4">
                 <p className="text-sm text-slate-500 dark:text-slate-400">If the customer is paying an amount right now, you can record it here.</p>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount Paid Today (₹)</label>
                    <input type="number" value={initialPayment.amount || ''} onChange={e => setInitialPayment({ ...initialPayment, amount: parseFloat(e.target.value) || 0 })} placeholder="0" className="form-input" />
                 </div>
                 {initialPayment.amount > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Payment Method</label>
                        <select value={initialPayment.method} onChange={e => setInitialPayment({ ...initialPayment, method: e.target.value as PaymentMethod })} className="form-input">
                            <option value="cash">Cash</option>
                            <option value="upi">UPI</option>
                        </select>
                      </div>
                 )}
             </div>
             <div className="flex gap-4 mt-6">
                 <Button onClick={prevStep} variant="secondary" className="w-full">Back</Button>
                 <Button onClick={onGenerate} className="w-full">Generate Preview</Button>
            </div>
        </Card>
    );
};

const PreviewStep = ({ invoice, onSave, onEdit }: { invoice: Invoice, onSave: () => void, onEdit: () => void }) => (
    <div>
        <h3 className="font-bold text-lg mb-4 text-center text-slate-800 dark:text-slate-100">Invoice Preview</h3>
        <InvoicePreview invoiceData={invoice} />
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <Button onClick={onEdit} variant="secondary" className="w-full">
                <Icon name="pencil" className="w-5 h-5"/>
                Edit Invoice
            </Button>
            <Button onClick={onSave} className="w-full">
                <Icon name="document-duplicate" className="w-5 h-5"/>
                Confirm & Save Invoice
            </Button>
        </div>
    </div>
);