import { useEffect, useRef, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useToast } from '../context/ToastContext';

/**
 * Subscribe to network connectivity and show a toast when going online/offline.
 * Keeps last state in a ref to suppress duplicate toasts.
 */
export function useNetworkStatusToast() {
  const toast = useToast();
  const lastIsConnected = useRef<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const isConnected = !!state.isConnected;
      if (lastIsConnected.current === null) {
        lastIsConnected.current = isConnected;
        return; // skip initial
      }
      if (isConnected !== lastIsConnected.current) {
        if (isConnected) {
          toast.success('You are back online');
        } else {
          toast.warning?.('You are offline');
        }
        lastIsConnected.current = isConnected;
      }
    });
    return () => unsubscribe();
  }, [toast]);
}

/**
 * Hook that returns current network status and provides a callback when status changes to online.
 * Use this to trigger immediate queue replay on reconnect.
 */
export function useNetworkStatus(onOnline?: () => void) {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const lastIsConnected = useRef<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = !!state.isConnected;
      setIsConnected(connected);
      
      // Trigger callback when transitioning from offline to online
      if (lastIsConnected.current !== null && !lastIsConnected.current && connected) {
        onOnline?.();
      }
      
      lastIsConnected.current = connected;
    });
    return () => unsubscribe();
  }, [onOnline]);

  return { isConnected };
}
