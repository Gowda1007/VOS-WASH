import React, { useMemo, useState } from 'react';
import type { Customer, Invoice, Product, Order, OrderStatus, AppSettings } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { Card, Badge, Button, Icon, Modal } from './Common';
import { InvoicePreview } from './InvoicePreview';
import { calculateInvoiceTotal, calculateStatus } from '../hooks/useInvoices';

type CartItem = Product & { quantity: number };

interface CustomerDashboardProps {
  customer: Customer;
  allInvoices: Invoice[];
  products: Product[];
  orders: Order[];
  onPlaceOrder: (order: Omit<Order, 'id'>) => void;
  settings: AppSettings;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ customer, allInvoices, products, orders, onPlaceOrder, settings }) => {
    const { logout } = useAuth();
    const toast = useToast();
    const [view, setView] = useState<'invoices' | 'shop' | 'orders'>('invoices');
    const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

    const customerInvoices = useMemo(() => {
        return allInvoices
            .filter(inv => inv.customerPhone === customer.phone)
            .map(inv => ({
                ...inv,
                totalAmount: calculateInvoiceTotal(inv.services),
                status: calculateStatus(inv),
            }))
            .sort((a, b) => b.id - a.id);
    }, [allInvoices, customer.phone]);

    const handlePreviewInvoice = (invoice: Invoice) => {
        setPreviewInvoice(invoice);
    };

    const handleAddToCart = (product: Product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            if (existingItem) {
                return prevCart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prevCart, { ...product, quantity: 1 }];
        });
        setIsCartOpen(true);
    };

    const handlePlaceOrder = () => {
        const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const newOrder: Omit<Order, 'id'> = {
            customerPhone: customer.phone,
            customerName: customer.name,
            products: cart,
            totalAmount,
            status: 'pending_payment',
            orderDate: new Date().toLocaleDateString("en-IN"),
        };
        onPlaceOrder(newOrder);
        setCart([]);
        setIsCartOpen(false);
        toast.success('Order placed successfully! We will process it shortly.');
        setView('orders');
    };

    const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
    const cartItemCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
    
    if (previewInvoice) {
        return (
            <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4 md:p-8">
                 <main className="max-w-4xl mx-auto">
                    <Button onClick={() => setPreviewInvoice(null)} variant="secondary" className="mb-4">
                        <Icon name="arrow-left" className="w-5 h-5"/>
                        Back
                    </Button>
                    <InvoicePreview invoiceData={previewInvoice} />
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
            {/* Header */}
            <header className="bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold">Welcome, {customer.name}!</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block">Your personal VOS WASH portal.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={() => setIsCartOpen(true)} className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                                <Icon name="shopping-cart" className="w-6 h-6"/>
                                {cartItemCount > 0 && (
                                    <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">{cartItemCount}</span>
                                )}
                            </button>
                            <Button onClick={logout} variant="secondary" className="!px-3 !py-2">
                                <Icon name="logout" className="w-5 h-5 sm:mr-2"/>
                                <span className="hidden sm:inline">Logout</span>
                            </Button>
                        </div>
                    </div>
                    {/* Tabs */}
                    <div className="border-b border-slate-200 dark:border-slate-700">
                         <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                            <TabButton label="My Invoices" isActive={view === 'invoices'} onClick={() => setView('invoices')} />
                            <TabButton label="Shop Products" isActive={view === 'shop'} onClick={() => setView('shop')} />
                            <TabButton label="My Orders" isActive={view === 'orders'} onClick={() => setView('orders')} />
                         </nav>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-4 md:p-8">
                 {view === 'invoices' && <InvoicesView invoices={customerInvoices} onPreview={handlePreviewInvoice} />}
                 {view === 'shop' && <ShopView products={products} onAddToCart={handleAddToCart} />}
                 {view === 'orders' && <OrdersView orders={orders} onSelectOrder={setViewingOrder}/>}
            </main>
            
            {/* Cart Modal */}
            <CartModal 
                isOpen={isCartOpen} 
                onClose={() => setIsCartOpen(false)}
                cart={cart}
                setCart={setCart}
                cartTotal={cartTotal}
                onPlaceOrder={handlePlaceOrder}
                upiId={settings.upiId}
            />

            {/* View Order Modal */}
            {viewingOrder && (
                 <Modal isOpen={!!viewingOrder} onClose={() => setViewingOrder(null)} title={`Order #${viewingOrder.id}`}>
                    <OrderDetails order={viewingOrder} />
                 </Modal>
            )}
        </div>
    );
};

// --- Sub-components for each view ---

const TabButton: React.FC<{label: string, isActive: boolean, onClick: () => void}> = ({label, isActive, onClick}) => (
    <button onClick={onClick} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition ${isActive ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
        {label}
    </button>
)

const InvoicesView: React.FC<{invoices: (Invoice & {totalAmount: number, status: string})[], onPreview: (inv: Invoice) => void}> = ({invoices, onPreview}) => (
    <Card>
        <div className="p-6"><h2 className="text-2xl font-bold">My Invoices</h2></div>
        {invoices.length > 0 ? (
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                {invoices.map(inv => (
                    <li key={inv.id} className="p-4 sm:p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <p className="font-semibold text-slate-800 dark:text-slate-100">Invoice #{inv.invoiceNumber}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{inv.invoiceDate}</p>
                            </div>
                            <div className="flex items-center gap-4 self-end sm:self-center">
                                    <div className="text-right">
                                        <p className="font-bold text-lg text-slate-800 dark:text-slate-100">₹{inv.totalAmount.toLocaleString('en-IN')}</p>
                                        <StatusBadge status={inv.status} />
                                    </div>
                                <Button onClick={() => onPreview(inv)} variant="secondary">View</Button>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        ) : <p className="p-8 text-center text-slate-500 dark:text-slate-400">You have no invoices yet.</p>}
    </Card>
);

const ShopView: React.FC<{products: Product[], onAddToCart: (p: Product) => void}> = ({products, onAddToCart}) => (
    <div>
        <h2 className="text-2xl font-bold mb-6">Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map(p => (
                <Card key={p.id} className="flex flex-col">
                    <img src={p.image} alt={p.name} className="w-full h-48 object-cover rounded-t-lg" />
                    <div className="p-4 flex flex-col flex-grow">
                        <h3 className="font-bold text-lg">{p.name}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 flex-grow my-2">{p.description}</p>
                        <div className="flex justify-between items-center mt-4">
                            <p className="font-extrabold text-xl">₹{p.price}</p>
                            <Button onClick={() => onAddToCart(p)}><Icon name="shopping-cart" className="w-5 h-5 mr-2"/>Add</Button>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    </div>
);

const OrdersView: React.FC<{orders: Order[], onSelectOrder: (o: Order) => void}> = ({orders, onSelectOrder}) => (
    <Card>
        <div className="p-6"><h2 className="text-2xl font-bold">My Orders</h2></div>
         {orders.length > 0 ? (
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                        <tr>
                            <th className="p-4 font-semibold text-sm">Order ID</th>
                            <th className="p-4 font-semibold text-sm">Date</th>
                            <th className="p-4 font-semibold text-sm">Total</th>
                            <th className="p-4 font-semibold text-sm">Status</th>
                            <th className="p-4 font-semibold text-sm"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(o => (
                            <tr key={o.id} className="border-b dark:border-slate-700">
                                <td className="p-4 font-mono text-indigo-600">#{o.id.toString().slice(-6)}</td>
                                <td className="p-4">{o.orderDate}</td>
                                <td className="p-4 font-semibold">₹{o.totalAmount.toLocaleString('en-IN')}</td>
                                <td className="p-4"><OrderStatusBadge status={o.status} /></td>
                                <td className="p-4 text-right"><Button onClick={() => onSelectOrder(o)} variant="secondary">Details</Button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ) : <p className="p-8 text-center text-slate-500 dark:text-slate-400">You have no orders yet.</p>}
    </Card>
);

const OrderDetails: React.FC<{order: Order}> = ({ order }) => (
    <div className="space-y-4">
        <div>
            <h4 className="font-semibold">Products</h4>
            <ul className="list-disc list-inside text-slate-600 dark:text-slate-300">
                {order.products.map(p => <li key={p.id}>{p.name} (x{p.quantity})</li>)}
            </ul>
        </div>
        {order.shippingDetails && (
            <div>
                 <h4 className="font-semibold">Shipping Information</h4>
                 <p><strong>Courier:</strong> {order.shippingDetails.courier}</p>
                 <p><strong>Tracking #:</strong> {order.shippingDetails.trackingNumber}</p>
                 <p><strong>Date:</strong> {order.shippingDetails.date}</p>
                 {order.shippingDetails.photo && <img src={order.shippingDetails.photo} alt="Shipping proof" className="mt-2 rounded-lg max-h-60" />}
            </div>
        )}
    </div>
);


const CartModal = ({isOpen, onClose, cart, setCart, cartTotal, onPlaceOrder, upiId}: any) => {
    const updateQuantity = (productId: number, newQuantity: number) => {
        if (newQuantity < 1) {
             setCart((prev: CartItem[]) => prev.filter(item => item.id !== productId));
        } else {
             setCart((prev: CartItem[]) => prev.map(item => item.id === productId ? {...item, quantity: newQuantity} : item));
        }
    }
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Your Shopping Cart">
            {cart.length > 0 ? (
                <div className="flex flex-col h-full">
                    <div className="flex-grow overflow-y-auto -mx-6 px-6">
                        {cart.map((item: CartItem) => (
                            <div key={item.id} className="flex items-center gap-4 py-3 border-b dark:border-slate-700">
                                <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-md"/>
                                <div className="flex-grow">
                                    <p className="font-semibold">{item.name}</p>
                                    <p className="text-sm text-slate-500">₹{item.price}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-2 py-0.5 border rounded-md">-</button>
                                    <span>{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-2 py-0.5 border rounded-md">+</button>
                                </div>
                                <p className="font-bold w-20 text-right">₹{item.price * item.quantity}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 pt-4 border-t dark:border-slate-700">
                        <div className="text-center bg-indigo-50 dark:bg-slate-700 p-3 rounded-lg mb-4">
                            <p className="text-sm">Please pay using the UPI ID below and place your order.</p>
                            <p className="font-bold text-lg text-indigo-700 dark:text-indigo-300 mt-1">{upiId}</p>
                        </div>
                        <div className="flex justify-between items-center text-2xl font-bold mb-4">
                            <span>Total:</span>
                            <span>₹{cartTotal.toLocaleString('en-IN')}</span>
                        </div>
                        <Button onClick={onPlaceOrder} className="w-full !text-lg !py-3">Place Order</Button>
                    </div>
                </div>
            ) : (
                <p className="text-center py-12 text-slate-500">Your cart is empty.</p>
            )}
        </Modal>
    )
}

const StatusBadge: React.FC<{status: any}> = ({ status }) => {
  if (status === 'paid') return <Badge color="green">Paid</Badge>;
  if (status === 'partially_paid') return <Badge color="amber">Partial</Badge>;
  return <Badge color="red">Unpaid</Badge>;
};

const OrderStatusBadge: React.FC<{status: OrderStatus}> = ({ status }) => {
  switch(status) {
    case 'pending_payment': return <Badge color="amber">Pending Payment</Badge>;
    case 'processing': return <Badge color="blue">Processing</Badge>;
    case 'shipped': return <Badge color="green">Shipped</Badge>;
    case 'cancelled': return <Badge color="red">Cancelled</Badge>;
    default: return <Badge color="slate">Unknown</Badge>;
  }
};
