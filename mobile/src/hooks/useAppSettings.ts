import { useState, useEffect } from 'react';
import type { AppSettings } from '../core/types';
import { apiService } from '../services';
import { realtimeClient } from '../services/realtimeClient';

const DEFAULT_SETTINGS: AppSettings = {
    upiId: '9845418725@ybl',
    companyName: 'VOS WASH',
    companyAddress: 'Uttarahalli, Bengaluru - 61',
    companyPhone: '+91 9845418725 / 6363178431',
    companyEmail: 'voswash@gmail.com',
    companyTagline: 'Clean Everything',
    gstNumber: '',
    invoiceLanguage: 'en',
};

export const useAppSettings = () => {
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Initial fetch
        setLoading(true);
        setError(null);
        apiService.getSettings()
            .then(data => {
                const merged: AppSettings = { ...DEFAULT_SETTINGS, ...data };
                setSettings(merged);
                setLoading(false);
            })
            .catch(err => {
                setError(err instanceof Error ? err.message : 'Failed to fetch settings');
                console.error("Error fetching app settings:", err);
                setSettings(DEFAULT_SETTINGS);
                setLoading(false);
            });

        // Realtime updates to keep other devices in sync
        const baseUrl = (process.env.EXPO_PUBLIC_WS_URL || (apiService as any).config?.baseURL?.replace(/\/api$/, '')) as string;
        if (baseUrl) realtimeClient.connect(baseUrl);
        const unsubscribe = realtimeClient.subscribe('settings:', async () => {
            try {
                const latest = await apiService.getSettings();
                setSettings({ ...DEFAULT_SETTINGS, ...latest });
            } catch (e) {
                // Ignore transient errors; next update or relaunch will refresh
            }
        });

        return () => { unsubscribe(); };
    }, []);

    const saveSettings = async (newSettings: AppSettings) => {
        // Ensure defaults merged before send to server (so no field lost if UI partial update)
        const toPersist: AppSettings = { ...DEFAULT_SETTINGS, ...newSettings };
        const updatedSettings = await apiService.saveSettings(toPersist);
        setSettings({ ...DEFAULT_SETTINGS, ...updatedSettings });
    };

    return { 
        settings, 
        loading, 
        error, 
        saveSettings 
    };
};
