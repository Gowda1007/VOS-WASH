import { useState, useEffect } from 'react';
import type { ServiceSets } from '../types';
import * as apiService from '../services/apiService';
import { DEFAULT_SERVICE_SETS } from '../constants';

export const useServices = () => {
    const [serviceSets, setServiceSets] = useState<ServiceSets | null>(null);

    useEffect(() => {
        // Since real-time sync is removed, we fetch data once on mount.
        // If real-time sync is required, a new mechanism (e.g., WebSockets) must be implemented.
        apiService.getServiceSets()
            .then(setServiceSets)
            .catch(error => {
                console.error("Error fetching service sets:", error);
                setServiceSets(DEFAULT_SERVICE_SETS);
            });
    }, []);

    const saveServiceSets = async (newServiceSets: ServiceSets) => {
        // We rely on the onSnapshot listener to update the state (setServiceSets)
        await apiService.saveServiceSets(newServiceSets);
    };
    
    // Return a default structure while loading to prevent errors in components
    const safeServiceSets = serviceSets || DEFAULT_SERVICE_SETS;

    return { serviceSets: safeServiceSets, saveServiceSets };
};
