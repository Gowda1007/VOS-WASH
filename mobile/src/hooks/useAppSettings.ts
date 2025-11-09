import { useState, useEffect } from 'react';
import type { AppSettings } from '../core/types';
import { apiService } from '../services';

const DEFAULT_SETTINGS: AppSettings = {
    upiId: 'your-upi-id@okhdfcbank',
};

export const useAppSettings = () => {
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Replace real-time listener with a one-time fetch
        setLoading(true);
        setError(null);
        apiService.getSettings()
            .then(data => {
                setSettings(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err instanceof Error ? err.message : 'Failed to fetch settings');
                console.error("Error fetching app settings:", err);
                // Fallback to default settings on error
                setSettings(DEFAULT_SETTINGS);
                setLoading(false);
            });
    }, []);

    const saveSettings = async (newSettings: AppSettings) => {
        const updatedSettings = await apiService.saveSettings(newSettings);
        // Manually update state since real-time listener is removed
        setSettings(updatedSettings);
    };

    return { 
        settings, 
        loading, 
        error, 
        saveSettings 
    };
};
