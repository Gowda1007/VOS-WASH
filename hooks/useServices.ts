import { useState, useEffect } from 'react';
import type { ServiceSets } from '../types';
import * as apiService from '../services/apiService';

export const useServices = () => {
    const [serviceSets, setServiceSets] = useState<ServiceSets | null>(null);

    useEffect(() => {
        const fetchServiceSets = async () => {
            const data = await apiService.getServiceSets();
            setServiceSets(data);
        };
        fetchServiceSets();
    }, []);

    const saveServiceSets = async (newServiceSets: ServiceSets) => {
        const savedSets = await apiService.saveServiceSets(newServiceSets);
        setServiceSets(savedSets);
    };
    
    // Return a default structure while loading to prevent errors in components
    const safeServiceSets = serviceSets || { customer: [], garage_service_station: [], dealer: [] };

    return { serviceSets: safeServiceSets, saveServiceSets };
};