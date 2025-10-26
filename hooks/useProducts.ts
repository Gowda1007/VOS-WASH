import { useLocalStorage } from './useLocalStorage';
import type { Product } from '../types';
import { PRODUCTS_STORAGE_KEY } from '../constants';

const initialProducts: Product[] = [
    { id: 1, name: "Premium Car Shampoo", price: 500, description: "A high-quality, pH-neutral car shampoo that provides a thick lather.", image: "/shampoo.png" },
    { id: 2, name: "Microfiber Towel Set", price: 800, description: "Set of 3 ultra-soft, absorbent microfiber towels for drying and polishing.", image: "/towel.png" },
    { id: 3, name: "All-Purpose Cleaner", price: 450, description: "Versatile cleaner for both interior and exterior surfaces.", image: "/cleaner.png" },
];

export const useProducts = () => {
    const [products, setProducts] = useLocalStorage<Product[]>(PRODUCTS_STORAGE_KEY, initialProducts);

    const addProduct = (productData: Omit<Product, 'id'>) => {
        const newProduct: Product = {
            id: Date.now(),
            ...productData,
        };
        setProducts(prev => [newProduct, ...prev]);
    };

    const updateProduct = (productId: number, updatedData: Partial<Omit<Product, 'id'>>) => {
        setProducts(prev => 
            prev.map(p => 
                p.id === productId ? { ...p, ...updatedData } : p
            )
        );
    };

    const deleteProduct = (productId: number) => {
        setProducts(prev => prev.filter(p => p.id !== productId));
    };

    return { products, addProduct, updateProduct, deleteProduct };
};
