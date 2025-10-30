import React, { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { Icon } from '../components/Common'; // Assuming Icon is now RN compatible

type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now();
    setToasts(prevToasts => [...prevToasts, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  const contextValue = useMemo(() => ({ addToast }), [addToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return {
      success: (message: string) => context.addToast(message, 'success'),
      error: (message: string) => context.addToast(message, 'error'),
      info: (message: string) => context.addToast(message, 'info'),
  };
};

export const ToastContainer: React.FC<{ toasts: ToastMessage[]; removeToast: (id: number) => void; }> = ({ toasts, removeToast }) => {
    return (
        <View style={styles.toastContainer}>
            {toasts.map(toast => (
                <ToastItem key={toast.id} {...toast} onDismiss={() => removeToast(toast.id)} />
            ))}
        </View>
    );
};

const ToastItem: React.FC<ToastMessage & { onDismiss: () => void }> = ({ message, type, onDismiss }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current; // Initial opacity 0
    const slideAnim = useRef(new Animated.Value(50)).current; // Initial slide from right

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
        ]).start();

        const timer = setTimeout(() => {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 300,
                    easing: Easing.in(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 50,
                    duration: 300,
                    easing: Easing.in(Easing.ease),
                    useNativeDriver: true,
                }),
            ]).start(() => onDismiss());
        }, 5000); // Auto-dismiss after 5 seconds

        return () => clearTimeout(timer);
    }, [fadeAnim, slideAnim, onDismiss]);

    const typeStyles = {
        success: { bg: styles.bgGreen500, icon: 'check-circle' },
        error: { bg: styles.bgRed500, icon: 'exclamation-triangle' },
        info: { bg: styles.bgBlue500, icon: 'info-circle' },
    };

    const iconType = typeStyles[type].icon as React.ComponentProps<typeof Icon>['name'];

    return (
        <Animated.View 
            style={[
                styles.toastItemBase, 
                typeStyles[type].bg, 
                { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }
            ]}
        >
            <Icon name={iconType} size={24} style={styles.toastIcon} />
            <Text style={styles.toastMessage}>{message}</Text>
            <TouchableOpacity onPress={onDismiss} style={styles.toastDismissButton}>
                <Icon name="x-mark" size={16} style={styles.toastDismissIcon}/>
            </TouchableOpacity>
        </Animated.View>
    );
};


const styles = StyleSheet.create({
    // Toast Container
    toastContainer: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        zIndex: 100, // Ensure it's on top
        gap: 12, // space-y-3
        width: 320, // w-80
    },
    toastItemBase: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16, // p-4
        borderRadius: 8, // rounded-lg
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        color: '#ffffff', // text-white
    },
    toastIcon: {
        width: 24, // w-6
        height: 24, // h-6
        marginRight: 12, // mr-3
        flexShrink: 0,
        color: '#ffffff',
    },
    toastMessage: {
        fontSize: 14, // text-sm
        fontWeight: '500', // font-medium
        flexGrow: 1,
        color: '#ffffff',
    },
    toastDismissButton: {
        marginLeft: 12, // ml-3
        padding: 4, // p-1
        borderRadius: 9999, // rounded-full
        // hover:bg-black/20 - No direct RN equivalent
    },
    toastDismissIcon: {
        width: 16, // w-4
        height: 16, // h-4
        color: '#ffffff',
    },
    bgGreen500: { backgroundColor: '#22c55e' },
    bgRed500: { backgroundColor: '#ef4444' },
    bgBlue500: { backgroundColor: '#3b82f6' },
});