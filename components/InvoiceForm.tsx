
import React, { useState, useEffect, useCallback } from 'react';
import type { Invoice, CustomerType, Service, Financials, Totals, InvoiceStatus } from '../types';
// FIX: Import DEFAULT_SERVICE_SETS and alias it to serviceSets.
import { DEFAULT_SERVICE_SETS as serviceSets } from '../constants';
import { InvoicePreview } from './InvoicePreview';
import { downloadPDF } from '../services/pdfService';

interface InvoiceFormProps {
    onGenerateAndPreview: (invoice: Invoice) => void;
    onSave: (invoice: Invoice) => void;
    existingInvoiceData: Invoice | null;
    invoices: Invoice[];
}

interface SelectedService extends Service {
    id: string;
}

const generateInvoiceNumber = (existingInvoices: Invoice[]): string => {
    const existingNumbers = new Set(existingInvoices.map(inv => inv.invoiceNumber));
    let newNumber;
    do {
        newNumber = Math.floor(Math.random() * 900000 + 100000).toString();
    } while (existingNumbers.has(newNumber));
    return newNumber;
};

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ onGenerateAndPreview, onSave, existingInvoiceData, invoices }) => {
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerType, setCustomerType] = useState<CustomerType>('customer');
    
    const [selectedServices, setSelectedServices] = useState<Record<string, { quantity: number, price: number, name: string}>>({});
    const [customServices, setCustomServices] = useState<SelectedService[]>([]);

    const [financials, setFinancials] = useState<Financials>({
        oldBalance: { amount: 0, date: '', included: false },
        advancePaid: { amount: 0, date: '', included: false },
        nowPaid: { amount: 0, included: false },
    });
    
    const [previewData, setPreviewData] = useState<Invoice | null>(existingInvoiceData);

    useEffect(() => {
        setInvoiceNumber(generateInvoiceNumber(invoices));
    }, [invoices]);

    useEffect(() => {
        if (customerPhone.length === 10) {
            const latestInvoice = [...invoices]
                .sort((a, b) => b.id - a.id)
                .find(inv => inv.customerPhone === customerPhone);

            if (latestInvoice) {
                setCustomerName(latestInvoice.customerName);
                setCustomerAddress(latestInvoice.customerAddress || '');
                if (latestInvoice.totals.remainingBalance > 0) {
                    const today = new Date().toISOString().split('T')[0];
                    setFinancials(f => ({ ...f, oldBalance: { amount: latestInvoice.totals.remainingBalance, date: today, included: true } }));
                }
            }
        }
    }, [customerPhone, invoices]);

    const handleServiceToggle = (name: string, price: number, isChecked: boolean) => {
        setSelectedServices(prev => {
            const newServices = { ...prev };
            if (isChecked) {
                newServices[name] = { quantity: 1, price, name };
            } else {
                delete newServices[name];
            }
            return newServices;
        });
    };

    const handleQuantityChange = (name: string, quantity: number) => {
        if (selectedServices[name]) {
            setSelectedServices(prev => ({
                ...prev,
                [name]: { ...prev[name], quantity: Math.max(1, quantity) }
            }));
        }
    };
    
    const handleAddCustomService = (name: string, price: number) => {
        if(name && price > 0) {
            setCustomServices(prev => [...prev, {id: `custom-${Date.now()}`, name, price, quantity: 1, total: price}])
        }
    };

    const handleGenerateClick = () => {
        const allServices: Service[] = [
            ...Object.values(selectedServices).map(s => ({ ...s, total: s.price * s.quantity })),
            ...customServices.map(s => ({...s, total: s.price * s.quantity}))
        ];

        if (!customerName || customerPhone.length !== 10) {
            alert("Please enter customer name and a valid 10-digit phone number.");
            return;
        }
        if (allServices.length === 0) {
            alert("Please select at least one service.");
            return;
        }

        const subtotal = allServices.reduce((sum, s) => sum + s.total, 0);
        const tax = subtotal * 0.18;
        const discount = tax; // As per original logic
        const total = Math.round(subtotal + tax - discount);
        const remainingBalance = total + (financials.oldBalance.included ? financials.oldBalance.amount : 0) - (financials.advancePaid.included ? financials.advancePaid.amount : 0) - (financials.nowPaid.included ? financials.nowPaid.amount : 0);

        const totals: Totals = { subtotal, tax, discount, total, remainingBalance };

        const invoiceData: Invoice = {
            id: Date.now(),
            invoiceNumber,
            invoiceDate: new Date().toLocaleDateString("en-IN"),
            customerName,
            customerPhone,
            customerAddress: customerAddress || "N/A",
            customerType,
            services: allServices,
            financials,
            totals,
            // FIX: Add missing 'status' property. It will be recalculated by useInvoices on save.
            status: 'unpaid',
        };

        setPreviewData(invoiceData);
        onGenerateAndPreview(invoiceData);
    };

    const handleSaveClick = () => {
        if (previewData) {
            onSave(previewData);
            // Reset form for next invoice
            setCustomerName('');
            setCustomerAddress('');
            setCustomerPhone('');
            setCustomerType('customer');
            setSelectedServices({});
            setCustomServices([]);
            setFinancials({ oldBalance: {amount: 0, date: '', included: false}, advancePaid: {amount: 0, date: '', included: false}, nowPaid: {amount: 0, included: false}});
            setPreviewData(null);
            setInvoiceNumber(generateInvoiceNumber(invoices));
        }
    };

    return (
        <div>
             <div className="flex justify-between items-baseline mb-4">
                <p><strong>Date:</strong> {new Date().toLocaleDateString("en-IN")}</p>
                <p><strong>Invoice #:</strong> {invoiceNumber}</p>
            </div>
            
            <CustomerDetailsSection {...{customerName, setCustomerName, customerAddress, setCustomerAddress, customerPhone, setCustomerPhone, customerType, setCustomerType}} />
            <ServicesSection {...{customerType, selectedServices, handleServiceToggle, handleQuantityChange, customServices, setCustomServices, handleAddCustomService}}/>
            <PaymentDetailsSection financials={financials} setFinancials={setFinancials} />

            <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <button onClick={handleGenerateClick} className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg transition duration-200">
                    {previewData ? 'Re-generate & Preview' : 'Generate & Preview Invoice'}
                </button>
            </div>
            
            {previewData && (
                <div className="mt-8">
                     <InvoicePreview invoiceData={previewData} />
                     <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                        <button onClick={handleSaveClick} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition">💾 Save Invoice</button>
                        <button onClick={() => window.print()} className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold transition">🖨️ Print Invoice</button>
                        <button onClick={() => downloadPDF(previewData, document.getElementById('invoice-preview-content'))} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-bold transition">⬇️ Download PDF</button>
                     </div>
                </div>
            )}
        </div>
    );
};


// Sub-components for better organization
const CustomerDetailsSection: React.FC<any> = ({customerName, setCustomerName, customerAddress, setCustomerAddress, customerPhone, setCustomerPhone, customerType, setCustomerType}) => (
    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 border-t pt-4">
        <Input label="Customer Name" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Enter customer name" />
        <Input label="Customer Address" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="Enter address" />
        <Input label="Customer Phone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value.replace(/\D/g, ''))} placeholder="Enter 10 digit phone number" maxLength={10} type="tel" />
        <div className="md:col-span-2">
            <label className="block font-semibold text-gray-700 mb-2">Customer Type</label>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
                {(['customer', 'garage', 'dealer'] as CustomerType[]).map(type => (
                    <Radio key={type} id={`type-${type}`} name="customerType" value={type} checked={customerType === type} onChange={() => setCustomerType(type)} label={type.charAt(0).toUpperCase() + type.slice(1)} />
                ))}
            </div>
        </div>
    </div>
);

const ServicesSection: React.FC<any> = ({customerType, selectedServices, handleServiceToggle, handleQuantityChange, customServices, setCustomServices, handleAddCustomService}) => {
    const [customName, setCustomName] = useState('');
    const [customPrice, setCustomPrice] = useState('');

    return (
        <div className="mt-8 border-t pt-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Select Services</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {serviceSets[customerType].map(service => (
                    <ServiceItem key={service.name} {...service} isChecked={!!selectedServices[service.name]} onToggle={handleServiceToggle} onQuantityChange={handleQuantityChange} quantity={selectedServices[service.name]?.quantity || 1} />
                ))}
                {customServices.map((service, index) => (
                    <ServiceItem key={service.id} {...service} isChecked={true} isCustom={true} onQuantityChange={(name, qty) => {
                       const newCustom = [...customServices];
                       newCustom[index].quantity = qty;
                       setCustomServices(newCustom);
                    }} quantity={service.quantity} />
                ))}
            </div>
            <div className="mt-6 border-t pt-4">
                <h2 className="text-lg font-semibold mb-2">Add Custom Goods / Service</h2>
                <div className="flex flex-col gap-3 sm:flex-row">
                    <input value={customName} onChange={e => setCustomName(e.target.value)} type="text" placeholder="Service name" className="flex-1 px-3 py-2 border rounded-md" />
                    <input value={customPrice} onChange={e => setCustomPrice(e.target.value)} type="number" placeholder="Price" className="w-full sm:w-32 px-3 py-2 border rounded-md" />
                    <button onClick={() => { handleAddCustomService(customName, parseFloat(customPrice)); setCustomName(''); setCustomPrice(''); }} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md">Add</button>
                </div>
            </div>
        </div>
    );
};

const PaymentDetailsSection: React.FC<{ financials: Financials, setFinancials: React.Dispatch<React.SetStateAction<Financials>> }> = ({ financials, setFinancials }) => {
    const handleToggle = (key: keyof Financials) => {
        setFinancials(f => ({ ...f, [key]: { ...f[key], included: !f[key].included } }));
    };
    const handleValueChange = (key: keyof Financials, value: string) => {
        setFinancials(f => ({ ...f, [key]: { ...f[key], amount: parseFloat(value) || 0 } }));
    };
    const handleDateChange = (key: 'oldBalance' | 'advancePaid', value: string) => {
        setFinancials(f => ({ ...f, [key]: { ...f[key], date: value } }));
    };

    return (
        <div className="mt-6 border-t pt-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Payment Details</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <PaymentInputBox label="Advance Paid (Earlier)" checked={financials.advancePaid.included} onToggle={() => handleToggle('advancePaid')}>
                    <input type="number" value={financials.advancePaid.amount || ''} onChange={e => handleValueChange('advancePaid', e.target.value)} placeholder="Amount (₹)" className="w-full px-3 py-2 border rounded-md" />
                    <input type="date" value={financials.advancePaid.date} onChange={e => handleDateChange('advancePaid', e.target.value)} className="w-full px-3 py-2 border rounded-md" />
                </PaymentInputBox>
                <PaymentInputBox label="Old Balance (Arrears)" checked={financials.oldBalance.included} onToggle={() => handleToggle('oldBalance')}>
                    <input type="number" value={financials.oldBalance.amount || ''} onChange={e => handleValueChange('oldBalance', e.target.value)} placeholder="Amount (₹)" className="w-full px-3 py-2 border rounded-md" />
                    <input type="date" value={financials.oldBalance.date} onChange={e => handleDateChange('oldBalance', e.target.value)} className="w-full px-3 py-2 border rounded-md" />
                </PaymentInputBox>
                <PaymentInputBox label="Now Paid (Today)" checked={financials.nowPaid.included} onToggle={() => handleToggle('nowPaid')}>
                    <input type="number" value={financials.nowPaid.amount || ''} onChange={e => handleValueChange('nowPaid', e.target.value)} placeholder="Amount (₹)" className="w-full px-3 py-2 border rounded-md" />
                </PaymentInputBox>
            </div>
        </div>
    );
};

const ServiceItem: React.FC<any> = ({ name, price, quantity, isChecked, isCustom, onToggle, onQuantityChange }) => (
    <div className={`flex justify-between items-center border p-3 rounded-md ${isCustom ? "bg-yellow-50" : "bg-white"}`}>
        <div>
            {!isCustom && <input type="checkbox" id={`service-${name}`} checked={isChecked} onChange={(e) => onToggle(name, price, e.target.checked)} className="mr-2" />}
            <label htmlFor={`service-${name}`} className="font-semibold text-sm">{name}</label>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-gray-600 text-sm">₹{price.toFixed(2)}</span>
            {isChecked && <input type="number" min="1" value={quantity} onChange={e => onQuantityChange(name, parseInt(e.target.value))} className="quantity w-16 border rounded px-2 py-1 text-center text-sm" />}
        </div>
    </div>
);

const PaymentInputBox: React.FC<{ label: string, checked: boolean, onToggle: () => void, children: React.ReactNode }> = ({label, checked, onToggle, children}) => (
    <div className="space-y-3 p-3 border rounded-md bg-gray-50">
        <div className="flex items-center">
            <input type="checkbox" checked={checked} onChange={onToggle} className="h-4 w-4 rounded" />
            <label className="ml-2 font-bold text-gray-700 text-sm">{label}</label>
        </div>
        {checked && <div className="space-y-3">{children}</div>}
    </div>
);

const Input: React.FC<any> = ({ label, ...props }) => (
    <div>
        <label className="block font-semibold text-gray-700 mb-1">{label}</label>
        <input {...props} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500" />
    </div>
);
const Radio: React.FC<any> = ({ label, ...props }) => (
    <div className="flex items-center">
        <input type="radio" {...props} className="focus:ring-blue-500 h-4 w-4" />
        <label htmlFor={props.id} className="ml-2 text-gray-700 text-sm">{label}</label>
    </div>
);