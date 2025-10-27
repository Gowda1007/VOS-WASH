import React, { useState } from 'react';
import type { Product } from '../types';
import { Card, Button, Icon, Modal } from './Common';
import { useToast } from '../hooks/useToast';

interface ProductManagementPageProps {
  products: Product[];
  onAdd: (product: Omit<Product, 'id'>) => void;
  onUpdate: (id: number, product: Partial<Omit<Product, 'id'>>) => void;
  onDelete: (id: number) => void;
}

const emptyProduct: Omit<Product, 'id'> = { name: '', price: 0, description: '', image: '' };

export const ProductManagementPage: React.FC<ProductManagementPageProps> = ({ products, onAdd, onUpdate, onDelete }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [productToEdit, setProductToEdit] = useState<Product | null>(null);
    const toast = useToast();

    const handleOpenModal = (product: Product | null) => {
        setProductToEdit(product);
        setIsModalOpen(true);
    };

    const handleSave = (productData: Omit<Product, 'id'>) => {
        if (productToEdit) {
            onUpdate(productToEdit.id, productData);
            toast.success('Product updated successfully!');
        } else {
            onAdd(productData);
            toast.success('Product added successfully!');
        }
        setIsModalOpen(false);
        setProductToEdit(null);
    };
    
    const handleDelete = (id: number) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            onDelete(id);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <p className="text-slate-500 dark:text-slate-400">Add, edit, and remove products for the customer shop.</p>
                <Button onClick={() => handleOpenModal(null)}>
                    <Icon name="plus" className="w-5 h-5"/>
                    Add Product
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map(product => (
                    <Card key={product.id} className="flex flex-col">
                        <img src={product.image} alt={product.name} className="w-full h-48 object-cover rounded-t-lg bg-slate-200 dark:bg-slate-700"/>
                        <div className="p-4 flex-grow flex flex-col">
                            <h3 className="font-bold text-lg">{product.name}</h3>
                            <p className="text-indigo-600 dark:text-indigo-400 font-semibold text-xl my-1">₹{product.price}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400 flex-grow">{product.description}</p>
                            <div className="flex justify-end gap-2 mt-4">
                                <Button onClick={() => handleOpenModal(product)} variant="secondary">Edit</Button>
                                <Button onClick={() => handleDelete(product.id)} variant="danger">Delete</Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {isModalOpen && (
                <ProductModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    product={productToEdit}
                />
            )}
        </div>
    );
};

// --- Product Modal ---

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (productData: Omit<Product, 'id'>) => void;
    product: Product | null;
}

const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onSave, product }) => {
    const [formData, setFormData] = useState<Omit<Product, 'id'>>(product ? { ...product } : emptyProduct);
    const toast = useToast();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'price' ? parseFloat(value) : value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, image: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || formData.price <= 0 || !formData.image) {
            toast.error('Please fill all fields and upload an image.');
            return;
        }
        onSave(formData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={product ? 'Edit Product' : 'Add New Product'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-1">Product Name</label>
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="block w-full px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900" />
                </div>
                 <div>
                    <label htmlFor="price" className="block text-sm font-medium mb-1">Price (₹)</label>
                    <input type="number" name="price" id="price" value={formData.price || ''} onChange={handleChange} required className="block w-full px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900" />
                </div>
                 <div>
                    <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
                    <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={3} className="block w-full px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900" />
                </div>
                <div>
                     <label htmlFor="image" className="block text-sm font-medium mb-1">Product Image</label>
                     <input type="file" name="image" id="image" accept="image/*" onChange={handleImageChange} className="block w-full text-sm text-slate-500 border border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 file:mr-4 file:py-3 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-slate-700 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-slate-600"/>
                     {formData.image && <img src={formData.image} alt="Preview" className="mt-4 rounded-lg h-32 w-32 object-cover"/>}
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" onClick={onClose} variant="secondary">Cancel</Button>
                    <Button type="submit">Save Product</Button>
                </div>
            </form>
        </Modal>
    );
}