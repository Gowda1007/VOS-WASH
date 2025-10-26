import React, { useState, useEffect } from 'react';
import type { Invoice, CustomerType, Service, Financials, Totals, Customer, ServiceSets, ManageableService } from '../types';
import { PageHeader, Card, Button, Icon } from './Common';
import { InvoicePreview } from './InvoicePreview';

interface InvoiceFormPageProps {
    onSave: (invoice: Invoice) => void;
    existingInvoice: Invoice | null;
    allInvoices: Invoice[];
    customers: Customer[];
    serviceSets: ServiceSets;
}

const generateInvoiceNumber = (existingInvoices: Invoice[]): string => {
    const existingNumbers = new Set(existingInvoices.map(inv => inv.invoiceNumber));
    let newNumber;
    do { newNumber = Math.floor(Math.random() * 900000 + 100000).toString(); } while (existingNumbers.has(newNumber));
    return newNumber;
};

export const InvoiceFormPage: React.FC<InvoiceFormPageProps> = (props) => {
    const [step, setStep] = useState(1);
    
    // Form State
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [customer, setCustomer] = useState<{ name: string; phone: string; address: string }>({ name: '', phone: '', address: '' });
    const [customerType, setCustomerType] = useState<CustomerType>('customer');
    const [selectedServices, setSelectedServices] = useState<Service[]>([]);
    const [financials, setFinancials] = useState<Financials>({
        oldBalance: { amount: 0, date: '', included: false },
        advancePaid: { amount: 0, date: '', included: false },
        nowPaid: { amount: 0, included: false },
    });

    const [previewData, setPreviewData] = useState<Invoice | null>(null);

    useEffect(() => {
        setInvoiceNumber(generateInvoiceNumber(props.allInvoices));
    }, [props.allInvoices]);
    
    const handleSelectCustomer = (c: Customer) => {
        setCustomer(c);
        const latestInvoice = [...props.allInvoices].sort((a, b) => b.id - a.id).find(inv => inv.customerPhone === c.phone);
        if (latestInvoice && latestInvoice.totals.remainingBalance > 0) {
            setFinancials(f => ({ ...f, oldBalance: { amount: latestInvoice.totals.remainingBalance, date: new Date().toISOString().split('T')[0], included: true } }));
        }
    };
    
    const handleGeneratePreview = () => {
        const subtotal = selectedServices.reduce((sum, s) => sum + (s.price * s.quantity), 0);
        const tax = subtotal * 0.18;
        const discount = tax;
        const total = Math.round(subtotal);
        const remainingBalance = total + (financials.oldBalance.included ? financials.oldBalance.amount : 0) - (financials.advancePaid.included ? financials.advancePaid.amount : 0) - (financials.nowPaid.included ? financials.nowPaid.amount : 0);
        const totals: Totals = { subtotal, tax, discount, total, remainingBalance };

        const invoiceData: Invoice = {
            id: props.existingInvoice?.id || Date.now(),
            invoiceNumber: props.existingInvoice?.invoiceNumber || invoiceNumber,
            invoiceDate: new Date().toLocaleDateString("en-IN"),
            customerName: customer.name, customerPhone: customer.phone, customerAddress: customer.address || "N/A",
            customerType, services: selectedServices, financials, totals, status: 'unpaid' // status will be recalculated on save
        };
        setPreviewData(invoiceData);
        setStep(4);
    };

    const renderStep = () => {
        switch (step) {
            case 1: return <CustomerStep customers={props.customers} customer={customer} setCustomer={setCustomer} onSelectCustomer={handleSelectCustomer} setCustomerType={setCustomerType} customerType={customerType} nextStep={() => setStep(2)} />;
            case 2: return <ServicesStep serviceSets={props.serviceSets} customerType={customerType} selectedServices={selectedServices} setSelectedServices={setSelectedServices} prevStep={() => setStep(1)} nextStep={() => setStep(3)} />;
            case 3: return <PaymentStep financials={financials} setFinancials={setFinancials} prevStep={() => setStep(2)} onGenerate={handleGeneratePreview} />;
            case 4: return <PreviewStep invoice={previewData!} onSave={() => props.onSave(previewData!)} onEdit={() => setStep(1)} />;
            default: return null;
        }
    };
    
    const pageTitle = props.existingInvoice ? "Edit Invoice" : "Create New Invoice";
    const pageSubtitle = step < 4 ? `Step ${step} of 3` : 'Step 4: Preview';

    return (
        <div>
            <PageHeader title={pageTitle} subtitle={pageSubtitle} />
            <div className="max-w-3xl mx-auto">{renderStep()}</div>
             <style>{`.form-input { @apply block w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900; }`}</style>
        </div>
    );
};

// --- Sub-components for each step ---

const CustomerStep = ({ customers, customer, setCustomer, onSelectCustomer, setCustomerType, customerType, nextStep }: any) => {
    const [search, setSearch] = useState('');
    const filteredCustomers = search ? customers.filter((c: Customer) => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)) : [];

    return (
        <Card className="p-6 md:p-8">
            <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">Customer Details</h3>
            <div className="space-y-4">
                <div className="relative">
                    <input type="text" placeholder="Search existing customer..." value={search} onChange={e => setSearch(e.target.value)} className="form-input" />
                    {search && filteredCustomers.length > 0 && (
                        <ul className="absolute z-10 w-full mt-1 border dark:border-slate-600 rounded-md max-h-40 overflow-y-auto bg-white dark:bg-slate-800 shadow-lg">
                            {filteredCustomers.map((c: Customer) => <li key={c.phone} onClick={() => { onSelectCustomer(c); setSearch(''); }} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">{c.name} - {c.phone}</li>)}
                        </ul>
                    )}
                </div>
                <input type="text" placeholder="Customer Name" value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} className="form-input" />
                <input type="tel" placeholder="Customer Phone (10 digits)" value={customer.phone} onChange={e => setCustomer({ ...customer, phone: e.target.value.replace(/\D/g, '')})} maxLength={10} className="form-input" />
                <input type="text" placeholder="Customer Address" value={customer.address} onChange={e => setCustomer({ ...customer, address: e.target.value })} className="form-input" />
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
        setSelectedServices((prev: Service[]) => prev.find(s => s.name === service.name) ? prev.filter(s => s.name !== service.name) : [...prev, { ...service, quantity: 1, total: service.price }]);
    };
    const handleQuantityChange = (name: string, quantity: number) => {
        setSelectedServices((prev: Service[]) => prev.map(s => s.name === name ? { ...s, quantity: Math.max(1, quantity), total: s.price * Math.max(1, quantity) } : s));
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

const PaymentStep = ({ financials, setFinancials, prevStep, onGenerate }: any) => {
    const handleToggle = (key: keyof Financials) => setFinancials((f: Financials) => ({ ...f, [key]: { ...f[key], included: !f[key].included } }));
    const handleValueChange = (key: keyof Financials, value: string) => setFinancials((f: Financials) => ({ ...f, [key]: { ...f[key], amount: parseFloat(value) || 0 } }));
    const handleDateChange = (key: 'oldBalance' | 'advancePaid', value: string) => setFinancials((f: Financials) => ({ ...f, [key]: { ...f[key], date: value } }));

    return (
        <Card className="p-6 md:p-8">
             <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">Payment Details</h3>
             <div className="space-y-4">
                 <PaymentInputBox label="Advance Paid (Earlier)" checked={financials.advancePaid.included} onToggle={() => handleToggle('advancePaid')}>
                    <input type="number" value={financials.advancePaid.amount || ''} onChange={e => handleValueChange('advancePaid', e.target.value)} placeholder="Amount (₹)" className="form-input" />
                    <input type="date" value={financials.advancePaid.date} onChange={e => handleDateChange('advancePaid', e.target.value)} className="form-input" />
                </PaymentInputBox>
                <PaymentInputBox label="Old Balance (Arrears)" checked={financials.oldBalance.included} onToggle={() => handleToggle('oldBalance')}>
                    <input type="number" value={financials.oldBalance.amount || ''} onChange={e => handleValueChange('oldBalance', e.target.value)} placeholder="Amount (₹)" className="form-input" />
                    <input type="date" value={financials.oldBalance.date} onChange={e => handleDateChange('oldBalance', e.target.value)} className="form-input" />
                </PaymentInputBox>
                <PaymentInputBox label="Now Paid (Today)" checked={financials.nowPaid.included} onToggle={() => handleToggle('nowPaid')}>
                    <input type="number" value={financials.nowPaid.amount || ''} onChange={e => handleValueChange('nowPaid', e.target.value)} placeholder="Amount (₹)" className="form-input" />
                </PaymentInputBox>
             </div>
             <div className="flex gap-4 mt-6">
                 <Button onClick={prevStep} variant="secondary" className="w-full">Back</Button>
                 <Button onClick={onGenerate} className="w-full">Generate Preview</Button>
            </div>
        </Card>
    );
};

const PaymentInputBox: React.FC<{ label: string, checked: boolean, onToggle: () => void, children: React.ReactNode }> = ({label, checked, onToggle, children}) => (
    <div className="space-y-3 p-4 border dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
        <label className="flex items-center">
            <input type="checkbox" checked={checked} onChange={onToggle} className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:bg-slate-700 dark:border-slate-500" />
            <span className="ml-3 font-medium text-slate-700 dark:text-slate-300">{label}</span>
        </label>
        {checked && <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700">{children}</div>}
    </div>
);


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
                Save Invoice
            </Button>
        </div>
    </div>
);