import React, { useState } from 'react';
import type { Order, OrderStatus, ShippingDetails, Customer } from '../types';
import { Card, Button, Icon, Modal, Badge, EmptyState } from './Common';

interface OrderManagementPageProps {
  orders: Order[];
  onUpdateOrder: (id: number, data: Partial<Omit<Order, 'id'>>) => void;
  customers: Customer[];
}

export const OrderManagementPage: React.FC<OrderManagementPageProps> = ({ orders, onUpdateOrder, customers }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);
    
    const customerMap = new Map(customers.map(c => [c.phone, c]));

    const handleOpenModal = (order: Order) => {
        setOrderToEdit(order);
        setIsModalOpen(true);
    };

    const handleSave = (updatedData: Partial<Omit<Order, 'id'>>) => {
        if (orderToEdit) {
            onUpdateOrder(orderToEdit.id, updatedData);
        }
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-6">
            <p className="text-slate-500 dark:text-slate-400">{`There are ${orders.length} total orders.`}</p>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="p-4 font-semibold text-sm">Order ID</th>
                                <th className="p-4 font-semibold text-sm">Customer</th>
                                <th className="p-4 font-semibold text-sm">Date</th>
                                <th className="p-4 font-semibold text-sm text-right">Amount</th>
                                <th className="p-4 font-semibold text-sm text-center">Status</th>
                                <th className="p-4 font-semibold text-sm"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length > 0 ? (
                                orders.map(order => (
                                    <tr key={order.id} className="border-b dark:border-slate-700">
                                        <td className="p-4 font-mono text-sm">#{order.id.toString().slice(-6)}</td>
                                        <td className="p-4">
                                            <div>{customerMap.get(order.customerPhone)?.name || order.customerName}</div>
                                            <div className="text-xs text-slate-500">{order.customerPhone}</div>
                                        </td>
                                        <td className="p-4 text-sm">{order.orderDate}</td>
                                        <td className="p-4 text-right font-semibold">₹{order.totalAmount.toLocaleString('en-IN')}</td>
                                        <td className="p-4 text-center"><OrderStatusBadge status={order.status}/></td>
                                        <td className="p-4 text-right">
                                            <Button onClick={() => handleOpenModal(order)} variant="secondary">Manage</Button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6}>
                                        <EmptyState 
                                            icon="shopping-cart"
                                            title="No Orders Yet"
                                            message="Customers can place orders from their portal once you've added products."
                                        />
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {isModalOpen && orderToEdit && (
                <OrderModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    order={orderToEdit}
                />
            )}
        </div>
    );
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

// --- Order Modal ---

interface OrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<Omit<Order, 'id'>>) => void;
    order: Order;
}

const OrderModal: React.FC<OrderModalProps> = ({ isOpen, onClose, onSave, order }) => {
    const [status, setStatus] = useState<OrderStatus>(order.status);
    const [shippingDetails, setShippingDetails] = useState<ShippingDetails>(order.shippingDetails || { courier: '', trackingNumber: '', photo: '', date: '' });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setShippingDetails(prev => ({ ...prev, photo: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSubmit = () => {
        const updateData: Partial<Omit<Order, 'id'>> = { status };
        if (status === 'shipped') {
            updateData.shippingDetails = { ...shippingDetails, date: new Date().toLocaleDateString("en-IN") };
        }
        onSave(updateData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Manage Order #${order.id.toString().slice(-6)}`}>
            <div className="space-y-6">
                <div>
                    <h4 className="font-semibold mb-2">Products Ordered</h4>
                    <ul className="list-disc list-inside text-slate-600 dark:text-slate-300">
                        {order.products.map(p => <li key={p.id}>{p.name} (x{p.quantity}) - ₹{p.price * p.quantity}</li>)}
                    </ul>
                </div>

                <div>
                    <label htmlFor="status" className="block text-sm font-medium mb-1">Order Status</label>
                    <select id="status" value={status} onChange={e => setStatus(e.target.value as OrderStatus)} className="form-input">
                        <option value="pending_payment">Pending Payment</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>

                {status === 'shipped' && (
                    <div className="p-4 border dark:border-slate-600 rounded-lg space-y-4 bg-slate-50 dark:bg-slate-900/50">
                        <h4 className="font-semibold">Shipping Details</h4>
                        <input type="text" placeholder="Courier Name" value={shippingDetails.courier} onChange={e => setShippingDetails(p => ({...p, courier: e.target.value}))} className="form-input" />
                        <input type="text" placeholder="Tracking Number" value={shippingDetails.trackingNumber} onChange={e => setShippingDetails(p => ({...p, trackingNumber: e.target.value}))} className="form-input" />
                        <div>
                             <label className="block text-sm font-medium mb-1">Shipping Photo</label>
                             <input type="file" accept="image/*" onChange={handleImageChange} className="form-input file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
                             {shippingDetails.photo && <img src={shippingDetails.photo} alt="Preview" className="mt-4 rounded-lg h-32 w-32 object-cover"/>}
                        </div>
                    </div>
                )}
                 <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" onClick={onClose} variant="secondary">Cancel</Button>
                    <Button type="button" onClick={handleSubmit}>Update Order</Button>
                </div>
            </div>
             <style>{`.form-input { @apply block w-full px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900; }`}</style>
        </Modal>
    );
};