import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal as RNModal, Animated, Easing, ScrollView } from 'react-native'; // FIX: Imported ScrollView
import { FontAwesome5, MaterialCommunityIcons } from './VectorIcons'; // Custom import for icons
import type { ToastMessage } from '../hooks/useToast';
import { useTheme } from '../hooks/useTheme';

// --- Logo Component ---
export const Logo: React.FC<{ style?: object }> = ({ style }) => (
    <Image 
        source={require('../assets/vos-logo.png')} 
        style={[styles.logoBase, style]} 
        accessibilityLabel="VOS WASH Logo"
    />
);

// --- Vari Image Component ---
export const Vari: React.FC<{ style?: object }> = ({ style }) => {
    const { resolvedTheme } = useTheme();
    const isDarkMode = resolvedTheme === 'dark';
    return (
        <View style={[styles.variBase, isDarkMode ? styles.variDark : styles.variLight, style]}>
            <Text style={[styles.variText, isDarkMode ? styles.textSlate300 : styles.textSlate700]}>
                Sri Vari Logo
            </Text>
        </View>
    );
};

// --- Icon Component ---
// Using react-native-vector-icons for better native look and performance
export const Icon: React.FC<{ name: string, size?: number, style?: object }> = ({ name, size = 24, style }) => {
    // Map common names to FontAwesome5 (or another suitable icon set)
    // You might need to expand this mapping based on the exact icons used
    const iconMapping: Record<string, { type: 'fa5' | 'mci', name: string }> = {
        'bars-3': { type: 'fa5', name: 'bars' },
        'chart-pie': { type: 'fa5', name: 'chart-pie' },
        'document-text': { type: 'fa5', name: 'file-alt' }, // Closest in FontAwesome5
        'users': { type: 'fa5', name: 'users' },
        'cog-6-tooth': { type: 'fa5', name: 'cog' },
        'plus-circle': { type: 'fa5', name: 'plus-circle' },
        'plus': { type: 'fa5', name: 'plus' },
        'arrow-left': { type: 'fa5', name: 'arrow-left' },
        'document-duplicate': { type: 'fa5', name: 'copy' },
        'trash': { type: 'fa5', name: 'trash' },
        'pencil': { type: 'fa5', name: 'pencil-alt' },
        'logout': { type: 'fa5', name: 'sign-out-alt' },
        'chart-bar-square': { type: 'fa5', name: 'chart-bar' },
        'eye': { type: 'fa5', name: 'eye' },
        'banknotes': { type: 'fa5', name: 'money-bill-alt' }, // Closest to banknotes
        'tag': { type: 'fa5', name: 'tag' },
        'shopping-cart': { type: 'fa5', name: 'shopping-cart' },
        'x-mark': { type: 'fa5', name: 'times' },
        'sun': { type: 'fa5', name: 'sun' },
        'moon': { type: 'fa5', name: 'moon' },
        'computer-desktop': { type: 'fa5', name: 'desktop' },
        'whatsapp': { type: 'fa5', name: 'whatsapp' },
        'printer': { type: 'fa5', name: 'print' },
        'ellipsis-vertical': { type: 'fa5', name: 'ellipsis-v' },
        'calendar-days': { type: 'fa5', name: 'calendar-alt' },
        'clipboard-document-list': { type: 'fa5', name: 'clipboard-list' },
        // Fallback for icons not explicitly mapped or using MaterialCommunityIcons
        'hamburger': { type: 'mci', name: 'menu' }, // Example MaterialCommunityIcons
    };

    const iconInfo = iconMapping[name];

    if (iconInfo) {
        if (iconInfo.type === 'fa5') {
            return <FontAwesome5 name={iconInfo.name} size={size} style={style} />;
        } else if (iconInfo.type === 'mci') {
            return <MaterialCommunityIcons name={iconInfo.name} size={size} style={style} />;
        }
    }
    // Fallback if icon not found in mapping
    return <Text style={[{ fontSize: size, color: 'black' }, style]}>?</Text>;
};


// --- Card Component ---
export const Card: React.FC<{ children: React.ReactNode, style?: object }> = ({ children, style }) => {
    const { resolvedTheme } = useTheme();
    const isDarkMode = resolvedTheme === 'dark';
    return (
        <View style={[styles.cardBase, isDarkMode ? styles.cardDark : styles.cardLight, style]}>
            {children}
        </View>
    );
};

// --- Badge Component ---
export const Badge: React.FC<{ color: 'green' | 'red' | 'amber' | 'blue' | 'slate', children: React.ReactNode }> = ({ color, children }) => {
    const colors = {
        green: { bg: styles.bgGreen100, text: styles.textGreen800, darkBg: styles.darkBgGreen900, darkText: styles.darkTextGreen300 },
        red: { bg: styles.bgRed100, text: styles.textRed800, darkBg: styles.darkBgRed900, darkText: styles.darkTextRed300 },
        amber: { bg: styles.bgAmber100, text: styles.textAmber800, darkBg: styles.darkBgAmber900, darkText: styles.darkTextAmber300 },
        blue: { bg: styles.bgBlue100, text: styles.textBlue800, darkBg: styles.darkBgBlue900, darkText: styles.darkTextBlue300 },
        slate: { bg: styles.bgSlate100, text: styles.textSlate800, darkBg: styles.darkBgSlate700, darkText: styles.darkTextSlate300 },
    };
    const { resolvedTheme } = useTheme();
    const isDarkMode = resolvedTheme === 'dark';
    const dynamicStyle = isDarkMode
        ? { backgroundColor: colors[color].darkBg.backgroundColor, color: colors[color].darkText.color }
        : { backgroundColor: colors[color].bg.backgroundColor, color: colors[color].text.color };

    return (
        <View style={[styles.badgeBase, dynamicStyle]}>
            <Text style={[styles.badgeText, dynamicStyle]}>
                {children}
            </Text>
        </View>
    );
};

// --- Button Component ---
type ButtonVariant = 'primary' | 'secondary' | 'danger';
export const Button: React.FC<{ 
    onPress?: () => void;
    children: React.ReactNode; 
    variant?: ButtonVariant; 
    style?: object; 
    disabled?: boolean;
}> = ({ onPress, children, variant = 'primary', style = {}, disabled }) => {
    const { resolvedTheme } = useTheme();
    const isDarkMode = resolvedTheme === 'dark';

    const baseStyles = [styles.buttonBase];
    const variantStyles: Record<ButtonVariant, any> = {
        primary: { 
            button: styles.buttonPrimary, 
            text: styles.buttonTextPrimary, 
            focus: styles.buttonPrimaryFocus,
            hover: styles.buttonPrimaryHover, // Not directly applicable in RN, but for conceptual mapping
        },
        secondary: { 
            button: isDarkMode ? styles.buttonSecondaryDark : styles.buttonSecondaryLight, 
            text: isDarkMode ? styles.buttonTextSecondaryDark : styles.buttonTextSecondaryLight, 
            focus: isDarkMode ? styles.buttonSecondaryFocusDark : styles.buttonSecondaryFocusLight,
            hover: isDarkMode ? styles.buttonSecondaryHoverDark : styles.buttonSecondaryHoverLight,
        },
        danger: { 
            button: styles.buttonDanger, 
            text: styles.buttonTextDanger, 
            focus: styles.buttonDangerFocus,
            hover: styles.buttonDangerHover,
        },
    };

    return (
        <TouchableOpacity 
            onPress={onPress} 
            disabled={disabled} 
            style={[baseStyles, variantStyles[variant].button, disabled && styles.buttonDisabled, style]}
            activeOpacity={0.8}
        >
            <Text style={[styles.buttonTextBase, variantStyles[variant].text]}>
                {children}
            </Text>
        </TouchableOpacity>
    );
};

// --- Toast Components ---
// FIX: Removed ToastContainer and ToastItem from Common.tsx as they are now in hooks/useToast.tsx
/*
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
    const [fadeAnim] = useState(new Animated.Value(0)); // Initial opacity 0
    const [slideAnim] = useState(new Animated.Value(50)); // Initial slide from right

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
*/
// --- Modal Component ---
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    const { resolvedTheme } = useTheme();
    const isDarkMode = resolvedTheme === 'dark';

    return (
        <RNModal
            animationType="fade"
            transparent={true}
            visible={isOpen}
            onRequestClose={onClose}
        >
            <TouchableOpacity 
                style={styles.modalOverlay} 
                activeOpacity={1} 
                onPress={onClose}
            >
                <View 
                    style={[styles.modalContent, isDarkMode ? styles.modalContentDark : styles.modalContentLight]}
                    onTouchStart={e => e.stopPropagation()} // Prevent closing when interacting with modal content
                >
                    <View style={[styles.modalHeader, isDarkMode ? styles.modalHeaderDark : styles.modalHeaderLight]}>
                        <Text style={[styles.modalTitle, isDarkMode ? styles.textLight : styles.textDark]}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={isDarkMode ? styles.modalCloseButtonDark : styles.modalCloseButtonLight}>
                            <Icon name="x-mark" size={24} style={isDarkMode ? styles.textLight : styles.textDark}/>
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.modalBody}>
                        {children}
                    </ScrollView>
                </View>
            </TouchableOpacity>
        </RNModal>
    );
};

// --- EmptyState Component ---
interface EmptyStateProps {
    icon: React.ComponentProps<typeof Icon>['name'];
    title: string;
    message: string;
}
export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message }) => {
    const { resolvedTheme } = useTheme();
    const isDarkMode = resolvedTheme === 'dark';
    return (
        <View style={styles.emptyStateBase}>
            <View style={[styles.emptyStateIconContainer, isDarkMode ? styles.emptyStateIconContainerDark : styles.emptyStateIconContainerLight]}>
                <Icon name={icon} size={32} style={[isDarkMode ? styles.textSlate500 : styles.textSlate400]}/>
            </View>
            <Text style={[styles.emptyStateTitle, isDarkMode ? styles.textLight : styles.textDark]}>{title}</Text>
            <Text style={[styles.emptyStateMessage, isDarkMode ? styles.textSlate400 : styles.textSlate500]}>{message}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    // Logo & Vari
    logoBase: {
        width: 48, // w-12
        height: 48, // h-12
        backgroundColor: '#bfdbfe', // bg-blue-200
        borderRadius: 24, // rounded-full
        justifyContent: 'center',
        alignItems: 'center',
        resizeMode: 'contain',
    },
    variBase: {
        width: 112, // w-28
        paddingVertical: 8, // p-2
        borderRadius: 6, // rounded-md
        justifyContent: 'center',
        alignItems: 'center',
    },
    variLight: {
        backgroundColor: '#e2e8f0', // bg-slate-200
    },
    variDark: {
        backgroundColor: '#334155', // bg-slate-700
    },
    variText: {
        fontSize: 10, // text-xs
        fontWeight: '600', // font-semibold
    },
    textSlate700: { color: '#475569' },
    textSlate300: { color: '#cbd5e1' },

    // Card
    cardBase: {
        borderRadius: 8, // rounded-lg
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
    },
    cardLight: {
        backgroundColor: '#ffffff', // bg-white
        borderColor: '#e2e8f0', // border-slate-200
    },
    cardDark: {
        backgroundColor: '#1e293b', // bg-slate-800
        borderColor: '#334155', // border-slate-700
    },

    // Badge
    badgeBase: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10, // px-2.5
        paddingVertical: 2, // py-0.5
        borderRadius: 9999, // rounded-full
    },
    badgeText: {
        fontSize: 12, // text-xs
        fontWeight: '600', // font-semibold
    },
    // Badge Colors
    bgGreen100: { backgroundColor: '#dcfce7' }, textGreen800: { color: '#166534' },
    darkBgGreen900: { backgroundColor: 'rgba(21, 57, 33, 0.5)' }, darkTextGreen300: { color: '#86efac' },
    
    bgRed100: { backgroundColor: '#fee2e2' }, textRed800: { color: '#991b1b' },
    darkBgRed900: { backgroundColor: 'rgba(74, 18, 18, 0.5)' }, darkTextRed300: { color: '#fca5a5' },
    
    bgAmber100: { backgroundColor: '#fffbe6' }, textAmber800: { color: '#92400e' },
    darkBgAmber900: { backgroundColor: 'rgba(84, 45, 0, 0.5)' }, darkTextAmber300: { color: '#fcd34d' },
    
    bgBlue100: { backgroundColor: '#e0f2fe' }, textBlue800: { color: '#075985' },
    darkBgBlue900: { backgroundColor: 'rgba(3, 49, 74, 0.5)' }, darkTextBlue300: { color: '#93c5fd' },
    
    bgSlate100: { backgroundColor: '#f1f5f9' }, textSlate800: { color: '#1e293b' },
    darkBgSlate700: { backgroundColor: '#334155' }, darkTextSlate300: { color: '#cbd5e1' },

    // Button
    buttonBase: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8, // gap-2
        paddingHorizontal: 16, // px-4
        paddingVertical: 12, // py-2.5
        borderRadius: 8, // rounded-lg
        // transition-all duration-200 - handled by activeOpacity
    },
    buttonTextBase: {
        fontWeight: '600', // font-semibold
        fontSize: 16,
    },
    buttonDisabled: {
        opacity: 0.5,
        // cursor-not-allowed is not applicable
    },
    // Primary Button
    buttonPrimary: {
        backgroundColor: '#4f46e5', // bg-indigo-600
    },
    buttonTextPrimary: {
        color: '#ffffff', // text-white
    },
    buttonPrimaryFocus: { // focus:ring-indigo-500
        // No direct RN equivalent, handled by ripple/activeOpacity
    },
    buttonPrimaryHover: { // hover:bg-indigo-700
        // No direct RN equivalent, handled by activeOpacity
    },
    // Secondary Button
    buttonSecondaryLight: {
        backgroundColor: '#e2e8f0', // bg-slate-200
    },
    buttonTextSecondaryLight: {
        color: '#1e293b', // text-slate-800
    },
    buttonSecondaryDark: {
        backgroundColor: '#334155', // dark:bg-slate-700
    },
    buttonTextSecondaryDark: {
        color: '#e2e8f0', // dark:text-slate-200
    },
    buttonSecondaryFocusLight: { // focus:ring-slate-500
        // No direct RN equivalent
    },
    buttonSecondaryHoverLight: { // hover:bg-slate-300
        // No direct RN equivalent
    },
    buttonSecondaryFocusDark: { // dark:focus:ring-slate-500
        // No direct RN equivalent
    },
    buttonSecondaryHoverDark: { // dark:hover:bg-slate-600
        // No direct RN equivalent
    },
    // Danger Button
    buttonDanger: {
        backgroundColor: '#dc2626', // bg-red-600
    },
    buttonTextDanger: {
        color: '#ffffff', // text-white
    },
    buttonDangerFocus: { // focus:ring-red-500
        // No direct RN equivalent
    },
    buttonDangerHover: { // hover:bg-red-700
        // No direct RN equivalent
    },

    // Toast Container - FIX: Removed from here. It's now in hooks/useToast.tsx
    /*
    toastContainer: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        zIndex: 100,
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
    */

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)', // bg-black/70
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16, // p-4
    },
    modalContent: {
        width: '100%', // w-full
        maxWidth: 768, // max-w-2xl
        maxHeight: '90%', // max-h-[90vh]
        borderRadius: 12, // rounded-xl
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        flexDirection: 'column',
    },
    modalContentLight: {
        backgroundColor: '#ffffff', // bg-white
    },
    modalContentDark: {
        backgroundColor: '#1e293b', // bg-slate-800
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16, // p-4
        borderBottomWidth: 1,
    },
    modalHeaderLight: {
        borderBottomColor: '#e2e8f0', // border-b
    },
    modalHeaderDark: {
        borderBottomColor: '#334155', // dark:border-slate-700
    },
    modalTitle: {
        fontSize: 20, // text-xl
        fontWeight: 'bold',
    },
    modalCloseButtonLight: {
        padding: 8, // p-2
        borderRadius: 9999, // rounded-full
        // hover:bg-slate-100
    },
    modalCloseButtonDark: {
        padding: 8, // p-2
        borderRadius: 9999, // rounded-full
        // dark:hover:bg-slate-700
    },
    modalBody: {
        padding: 24, // p-6
        flexGrow: 1,
    },
    textDark: { color: '#1e293b' }, // text-slate-800
    textLight: { color: '#f8fafc' }, // dark:text-slate-100

    // Empty State
    emptyStateBase: {
        textAlign: 'center',
        paddingVertical: 48, // py-12
        paddingHorizontal: 24, // px-6
        alignItems: 'center',
    },
    emptyStateIconContainer: {
        width: 64, // w-16
        height: 64, // h-16
        borderRadius: 9999, // rounded-full
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyStateIconContainerLight: {
        backgroundColor: '#f1f5f9', // bg-slate-100
    },
    emptyStateIconContainerDark: {
        backgroundColor: 'rgba(51, 65, 85, 0.5)', // dark:bg-slate-700/50
    },
    textSlate400: { color: '#94a3b8' }, // text-slate-400
    textSlate500: { color: '#64748b' }, // text-slate-500
    emptyStateTitle: {
        marginTop: 16, // mt-4
        fontSize: 20, // text-xl
        fontWeight: '600', // font-semibold
    },
    emptyStateMessage: {
        marginTop: 4, // mt-1
    },
});