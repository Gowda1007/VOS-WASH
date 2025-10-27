import { useState, useEffect } from 'react';
import type { Product } from '../types';
import * as apiService from '../services/apiService';

export const useProducts = () => {
    const [products, setProducts] = useState<Product[]>([]);

    useEffect(() => {
        const fetchProducts = async () => {
            const data = await apiService.getProducts();
            setProducts(data);
        };
        fetchProducts();
    }, []);

    const addProduct = async (productData: Omit<Product, 'id'>) => {
        const newProduct = await apiService.addProduct(productData);
        setProducts(prev => [newProduct, ...prev]);
    };

    const updateProduct = async (productId: number, updatedData: Partial<Omit<Product, 'id'>>) => {
        const updatedProduct = await apiService.updateProduct(productId, updatedData);
        if (updatedProduct) {
            setProducts(prev => 
                prev.map(p => 
                    p.id === productId ? updatedProduct : p
                )
            );
        }
    };

    const deleteProduct = async (productId: number) => {
        await apiService.deleteProduct(productId);
        setProducts(prev => prev.filter(p => p.id !== productId));
    };

    return { products, addProduct, updateProduct, deleteProduct };
};