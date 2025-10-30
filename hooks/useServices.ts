import { useState, useEffect } from 'react';
import type { ServiceSets } from '../types';
// Fix: Corrected malformed import statement
import * as apiService from '../services/apiService';
import { useAsyncStorage } from './useAsyncStorage'; // FIX: Updated import

export const useServices = () => {
    const [serviceSets, setServiceSets] = useState<ServiceSets | null>(null);

    useEffect(() => {
        const fetchServiceSets = async () => {
            // Fix: 'apiService' should now be correctly resolved
            const data = await apiService.getServiceSets();
            setServiceSets(data);
        };
        fetchServiceSets();
    }, []);

    const saveServiceSets = async (newServiceSets: ServiceSets) => {
        // Fix: 'apiService' should now be correctly resolved
        const savedSets = await apiService.saveServiceSets(newServiceSets);
        setServiceSets(savedSets);
    };
    
    // Return a default structure while loading to prevent errors in components
    const safeServiceSets = serviceSets || { customer: [], garage_service_station: [], dealer: [] };

    return { serviceSets: safeServiceSets, saveServiceSets };
};