import React, { useState, useEffect } from 'react';
import type { Invoice, CustomerType, Service, Customer, ServiceSets, ManageableService, PaymentMethod } from '../types';
import { PageHeader, Card, Button, Icon } from './Common';
import { InvoicePreview } from './InvoicePreview';
import { CUSTOMER_TYPE_LABELS } from '../constants';

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
    
    // FEATURE IMPLEMENTATION: State for new financial fields.
    const [oldBalance, setOldBalance] = useState<{ amount: number; date?: string }>({ amount: 0 });
    const [advancePaid, setAdvancePaid] = useState<{ amount: number; date?: string }>({ amount: 0 });
    const [initialPayment, setInitialPayment] = useState({ amount: 0, method: 'cash' as PaymentMethod });

    const [previewData, setPreviewData] = useState<Invoice | null>(null);

    const handleGeneratePreview = () => {
        // Construct a temporary invoice object for preview purposes.
        const invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'invoiceDate' | 'payments'> & { payments: any[] } = {
            customerName: customer.name, 
            customerPhone: customer.phone, 
            customerAddress: customer.address || "N/A",
            customerType, 
            services: selectedServices,
            payments: [],
            oldBalance: oldBalance.amount > 0 ? oldBalance : undefined,
            advancePaid: advancePaid.amount > 0 ? advancePaid : undefined,
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
            oldBalance: oldBalance.amount > 0 ? oldBalance : undefined,
            advancePaid: advancePaid.amount > 0 ? advancePaid : undefined,
        };
        props.onSave(invoiceData, initialPayment);
    };

    const renderStep = () => {
        switch (step) {
            case 1: return <CustomerStep customers={props.customers} customer={customer} setCustomer={setCustomer} setCustomerType={setCustomerType} customerType={customerType} nextStep={() => setStep(2)} />;
            case 2: return <ServicesStep serviceSets={props.serviceSets} customerType={customerType} selectedServices={selectedServices} setSelectedServices={setSelectedServices} prevStep={() => setStep(1)} nextStep={() => setStep(3)} />;
            case 3: return <PaymentStep oldBalance={oldBalance} setOldBalance={setOldBalance} advancePaid={advancePaid} setAdvancePaid={setAdvancePaid} initialPayment={initialPayment} setInitialPayment={setInitialPayment} prevStep={() => setStep(2)} onGenerate={handleGeneratePreview} />;
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
             <style>{`.form-input { @apply block w-full px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900; }`}</style>
        </div>
    );
};

// --- Sub-components for each step ---

const CustomerStep = ({ customers, customer, setCustomer, setCustomerType, customerType, nextStep }: any) => {

    // FEATURE IMPLEMENTATION: Intelligent customer auto-fill.
    // When a 10-digit phone number is entered, it automatically populates the name and address
    // if the customer already exists, removing the need for a search button.
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
                        {(Object.keys(CUSTOMER_TYPE_LABELS) as CustomerType[]).map(type => (
                            <label key={type} className="flex items-center">
                                <input type="radio" name="customerType" value={type} checked={customerType === type} onChange={() => setCustomerType(type)} className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:bg-slate-700 dark:border-slate-500"/>
                                {CUSTOMER_TYPE_LABELS[type]}
                            </label>
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
            <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">Select Services for <span className="text-indigo-600 dark:text-indigo-400">{CUSTOMER_TYPE_LABELS[customerType]}</span></h3>
            <div className="space-y-3">
                {currentServiceSet.map((service: ManageableService) => {
                    const isSelected = selectedServices.some((s: Service) => s.name === service.name);
                    const currentService = selectedServices.find((s: Service) => s.name === service.name);
                    return (
                        <div key={service.name} className={`border dark:border-slate-700 p-3 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-2 transition ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
                            <label className="flex items-center font-medium"><input type="checkbox" checked={isSelected} onChange={() => handleToggle(service)} className="mr-3 h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:bg-slate-700 dark:border-slate-500"/>{service.name}</label>
                            <div className="flex items-center gap-2 self-end sm:self-center">
                               <span className="text-slate-600 dark:text-slate-300">₹{service.price}</span>
                               {isSelected && <input type="number" value={currentService?.quantity} onChange={e => handleQuantityChange(service.name, parseInt(e.target.value) || 1)} className="w-24 text-center border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-base bg-white dark:bg-slate-700" />}
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

// FEATURE IMPLEMENTATION: The PaymentStep is now a full financial details form.
const PaymentStep = ({ oldBalance, setOldBalance, advancePaid, setAdvancePaid, initialPayment, setInitialPayment, prevStep, onGenerate }: any) => {
    const [showOldBalance, setShowOldBalance] = useState(oldBalance.amount > 0);
    const [showAdvancePaid, setShowAdvancePaid] = useState(advancePaid.amount > 0);

    return (
        <Card className="p-6 md:p-8">
             <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">Financial Details</h3>
             <div className="space-y-6">
                 {/* Old Balance Section */}
                 <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border dark:border-slate-700">
                    <label className="flex items-center font-medium"><input type="checkbox" checked={showOldBalance} onChange={e => setShowOldBalance(e.target.checked)} className="mr-2 h-4 w-4 rounded text-red-600 focus:ring-red-500" /> Add Old Balance (Arrears)</label>
                    {showOldBalance && (
                        <div className="mt-3 space-y-2">
                             <input type="number" value={oldBalance.amount || ''} onChange={e => setOldBalance({ ...oldBalance, amount: parseFloat(e.target.value) || 0 })} placeholder="Amount (₹)" className="form-input" />
                             <input type="text" value={oldBalance.date || ''} onChange={e => setOldBalance({ ...oldBalance, date: e.target.value })} placeholder="Date / Reference (Optional)" className="form-input" />
                        </div>
                    )}
                 </div>

                 {/* Advance Paid Section */}
                 <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border dark:border-slate-700">
                    <label className="flex items-center font-medium"><input type="checkbox" checked={showAdvancePaid} onChange={e => setShowAdvancePaid(e.target.checked)} className="mr-2 h-4 w-4 rounded text-green-600 focus:ring-green-500"/> Add Advance Paid</label>
                    {showAdvancePaid && (
                        <div className="mt-3 space-y-2">
                            <input type="number" value={advancePaid.amount || ''} onChange={e => setAdvancePaid({ ...advancePaid, amount: parseFloat(e.target.value) || 0 })} placeholder="Amount (₹)" className="form-input" />
                            <input type="text" value={advancePaid.date || ''} onChange={e => setAdvancePaid({ ...advancePaid, date: e.target.value })} placeholder="Date / Reference (Optional)" className="form-input" />
                        </div>
                    )}
                 </div>

                 {/* Initial Payment Section */}
                 <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border dark:border-slate-700">
                     <p className="font-medium mb-2">Now Paid (Today)</p>
                     <div className="space-y-2">
                        <input type="number" value={initialPayment.amount || ''} onChange={e => setInitialPayment({ ...initialPayment, amount: parseFloat(e.target.value) || 0 })} placeholder="Amount (₹)" className="form-input" />
                        {initialPayment.amount > 0 && (
                            <select value={initialPayment.method} onChange={e => setInitialPayment({ ...initialPayment, method: e.target.value as PaymentMethod })} className="form-input">
                                <option value="cash">Cash</option>
                                <option value="upi">UPI</option>
                            </select>
                        )}
                     </div>
                 </div>
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