import { useState, useEffect } from 'react';
import { useToast } from './useToast';

export const useNetworkStatus = () => {
    const { warning, info } = useToast();
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
    const [initialCheckDone, setInitialCheckDone] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleOnline = () => {
            setIsOnline(true);
            if (initialCheckDone) {
                info('Connection restored. Data synchronization resumed.');
            }
        };

        const handleOffline = () => {
            setIsOnline(false);
            if (initialCheckDone) {
                warning('Connection lost. Working offline. Data will sync when connection is restored.');
            }
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Set initial check done after first render to prevent toast on load
        setInitialCheckDone(true);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [warning, info, initialCheckDone]);

    return isOnline;
};