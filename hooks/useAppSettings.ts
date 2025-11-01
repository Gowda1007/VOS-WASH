import { useState, useEffect } from 'react';
import type { AppSettings } from '../types';
import * as apiService from '../services/apiService';
import { db } from '../services/firebaseService';
import { doc, onSnapshot } from 'firebase/firestore';

const defaultSettings: AppSettings = {
    upiId: 'your-upi-id@okhdfcbank',
};

export const useAppSettings = () => {
    const [settings, setSettings] = useState<AppSettings>(defaultSettings);

    useEffect(() => {
        const APP_SETTINGS_DOC_ID = 'app_settings';
        const SETTINGS_COLLECTION = 'settings';
        const docRef = doc(db, SETTINGS_COLLECTION, APP_SETTINGS_DOC_ID);

        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                setSettings(docSnap.data() as AppSettings);
            } else {
                // If document doesn't exist, initialize it via apiService (which handles creation)
                apiService.getSettings().then(setSettings);
            }
        }, (error) => {
            console.error("Error fetching app settings:", error);
        });

        return () => unsubscribe();
    }, []);

    const saveSettings = async (newSettings: AppSettings) => {
        // We rely on the onSnapshot listener to update the state (setSettings)
        await apiService.saveSettings(newSettings);
    };

    return { settings, saveSettings };
};