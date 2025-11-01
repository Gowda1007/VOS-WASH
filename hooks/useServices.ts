import { useState, useEffect } from 'react';
import type { ServiceSets } from '../types';
import * as apiService from '../services/apiService';
import { db } from '../services/firebaseService';
import { doc, onSnapshot } from 'firebase/firestore';

export const useServices = () => {
    const [serviceSets, setServiceSets] = useState<ServiceSets | null>(null);

    useEffect(() => {
        const SERVICES_DOC_ID = 'service_sets';
        const SETTINGS_COLLECTION = 'settings';
        const docRef = doc(db, SETTINGS_COLLECTION, SERVICES_DOC_ID);

        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                setServiceSets(docSnap.data() as ServiceSets);
            } else {
                // If document doesn't exist, initialize it via apiService (which handles creation)
                apiService.getServiceSets().then(setServiceSets);
            }
        }, (error) => {
            console.error("Error fetching service sets:", error);
        });

        return () => unsubscribe();
    }, []);

    const saveServiceSets = async (newServiceSets: ServiceSets) => {
        // We rely on the onSnapshot listener to update the state (setServiceSets)
        await apiService.saveServiceSets(newServiceSets);
    };
    
    // Return a default structure while loading to prevent errors in components
    const safeServiceSets = serviceSets || { customer: [], garage_service_station: [], dealer: [] };

    return { serviceSets: safeServiceSets, saveServiceSets };
};
