import { useState, useEffect } from 'react';
import type { AppSettings } from '../types';
import * as apiService from '../services/apiService';

const defaultSettings: AppSettings = {
    upiId: 'your-upi-id@okhdfcbank',
};

export const useAppSettings = () => {
    const [settings, setSettings] = useState<AppSettings>(defaultSettings);

    useEffect(() => {
        // Replace real-time listener with a one-time fetch
        apiService.getSettings()
            .then(setSettings)
            .catch(error => {
                console.error("Error fetching app settings:", error);
                // Fallback to default settings on error
                setSettings(defaultSettings);
            });
    }, []);

    const saveSettings = async (newSettings: AppSettings) => {
        const updatedSettings = await apiService.saveSettings(newSettings);
        // Manually update state since real-time listener is removed
        setSettings(updatedSettings);
    };

    return { settings, saveSettings };
};