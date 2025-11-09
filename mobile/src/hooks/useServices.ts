import { useState, useEffect } from 'react';
import type { ServiceSets } from '../core/types';
import { apiService } from '../services';
import { DEFAULT_SERVICE_SETS } from '../constants';

export const useServices = () => {
    const [serviceSets, setServiceSets] = useState<ServiceSets | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Since real-time sync is removed, we fetch data once on mount.
        // If real-time sync is required, a new mechanism (e.g., WebSockets) must be implemented.
        setLoading(true);
        setError(null);
        apiService.getServiceSets()
            .then(data => {
                setServiceSets(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err instanceof Error ? err.message : 'Failed to fetch services');
                console.error("Error fetching service sets:", err);
                setServiceSets(DEFAULT_SERVICE_SETS);
                setLoading(false);
            });
    }, []);

    const saveServiceSets = async (newServiceSets: ServiceSets) => {
        // We rely on the onSnapshot listener to update the state (setServiceSets)
        await apiService.saveServiceSets(newServiceSets);
    };
    
    // Return a default structure while loading to prevent errors in components
    const safeServiceSets = serviceSets || DEFAULT_SERVICE_SETS;

    return { 
        serviceSets: safeServiceSets, 
        loading, 
        error, 
        saveServiceSets 
    };
};
