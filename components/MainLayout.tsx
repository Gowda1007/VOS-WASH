import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView, Platform, Animated, Easing } from 'react-native';
import { Icon, Logo, Button } from './Common';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';
import type { View as AppView } from '../types';

const { width } = Dimensions.get('window');

interface MainLayoutProps {
    children: React.ReactNode;
    currentView: AppView;
    pageTitle: string;
    onNavigate: (view: AppView) => void;
    onNewInvoice: () => void;
    onTakeOrder: () => void;
}

const navItems: { view: AppView; labelKey: string; icon: React.ComponentProps<typeof Icon>['name'] }[] = [
    { view: 'dashboard', labelKey: 'dashboard', icon: 'chart-pie' },
    { view: 'invoices', labelKey: 'invoices', icon: 'document-text' },
    { view: 'customers', labelKey: 'customers', icon: 'users' },
    { view: 'day-book', labelKey: 'day-book', icon: 'calendar-days' },
    { view: 'reports', labelKey: 'reports', icon: 'chart-bar-square' },
    { view: 'settings', labelKey: 'settings', icon: 'cog-6-tooth' },
];

export const MainLayout: React.FC<MainLayoutProps> = ({ children, currentView, pageTitle, onNavigate, onNewInvoice, onTakeOrder }) => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const { t } = useLanguage();
    const { resolvedTheme } = useTheme();
    const drawerAnim = useRef(new Animated.Value(-width * 0.75)).current; // Start off-screen

    useEffect(() => {
        Animated.timing(drawerAnim, {
            toValue: isDrawerOpen ? 0 : -width * 0.75,
            duration: 300,
            easing: Easing.ease,
            useNativeDriver: true,
        }).start();
    }, [isDrawerOpen]);

    const handleNavItemClick = useCallback((view: AppView) => {
        onNavigate(view);
        setIsDrawerOpen(false);
    }, [onNavigate]);

    const drawerBackgroundColor = resolvedTheme === 'dark' ? styles.drawerDark : styles.drawerLight;
    const headerBackgroundColor = resolvedTheme === 'dark' ? styles.headerDark : styles.headerLight;
    const headerTextColor = resolvedTheme === 'dark' ? styles.textLight : styles.textDark;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, headerBackgroundColor]}>
                <TouchableOpacity onPress={() => setIsDrawerOpen(true)} style={styles.menuButton}>
                    <Icon name="bars-3" size={24} style={resolvedTheme === 'dark' ? styles.textLight : styles.textDark} />
                </TouchableOpacity>
                <Text style={[styles.pageTitle, headerTextColor]}>{pageTitle}</Text>
                <View style={styles.rightHeaderPlaceholder} />
            </View>

            {/* Main Content */}
            <ScrollView style={styles.contentContainer} contentContainerStyle={styles.contentPadding}>
                {children}
            </ScrollView>

            {/* Floating Action Buttons */}
            <View style={styles.fabContainer}>
                <TouchableOpacity onPress={onTakeOrder} style={styles.fabSecondary} activeOpacity={0.8}>
                    <Icon name="shopping-cart" size={24} style={styles.fabIconSecondary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={onNewInvoice} style={styles.fabPrimary} activeOpacity={0.8}>
                    <Icon name="plus" size={24} style={styles.fabIconPrimary} />
                </TouchableOpacity>
            </View>

            {/* Drawer Overlay */}
            {isDrawerOpen && (
                <TouchableOpacity
                    style={styles.drawerOverlay}
                    activeOpacity={1}
                    onPress={() => setIsDrawerOpen(false)}
                />
            )}

            {/* Drawer */}
            <Animated.View style={[styles.drawer, drawerBackgroundColor, { transform: [{ translateX: drawerAnim }] }]}>
                <View style={styles.drawerHeader}>
                    <Logo style={styles.drawerLogo} />
                    <Text style={[styles.drawerTitle, headerTextColor]}>VOS WASH</Text>
                    <Text style={[styles.drawerTagline, headerTextColor]}>{t('app-tagline')}</Text>
                </View>
                <ScrollView contentContainerStyle={styles.drawerNav}>
                    {navItems.map(item => (
                        <TouchableOpacity
                            key={item.view}
                            onPress={() => handleNavItemClick(item.view)}
                            style={[
                                styles.navItem,
                                currentView === item.view ? (resolvedTheme === 'dark' ? styles.navItemActiveDark : styles.navItemActiveLight) : null
                            ]}
                        >
                            <Icon
                                name={item.icon}
                                size={20}
                                style={[
                                    styles.navIcon,
                                    currentView === item.view ? (resolvedTheme === 'dark' ? styles.navTextActiveDark : styles.navTextActiveLight) : (resolvedTheme === 'dark' ? styles.textLight : styles.textDark)
                                ]}
                            />
                            <Text
                                style={[
                                    styles.navText,
                                    currentView === item.view ? (resolvedTheme === 'dark' ? styles.navTextActiveDark : styles.navTextActiveLight) : (resolvedTheme === 'dark' ? styles.textLight : styles.textDark)
                                ]}
                            >
                                {t(item.labelKey)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
                <View style={[styles.drawerFooter, resolvedTheme === 'dark' ? styles.drawerFooterDark : styles.drawerFooterLight]}>
                    <Text style={resolvedTheme === 'dark' ? styles.textSlate400 : styles.textSlate600}>
                        VOS WASH © 2024
                    </Text>
                </View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f1f5f9', // bg-slate-100
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0', // border-slate-200
        height: Platform.OS === 'ios' ? 60 : 56, // Adjust for iOS status bar
    },
    headerLight: {
        backgroundColor: '#f1f5f9', // bg-slate-100
        borderBottomColor: '#e2e8f0',
    },
    headerDark: {
        backgroundColor: '#1e293b', // bg-slate-800
        borderBottomColor: '#334155',
    },
    menuButton: {
        padding: 8,
    },
    pageTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        flex: 1,
    },
    rightHeaderPlaceholder: {
        width: 40, // To balance the menu button on the left
    },
    contentContainer: {
        flex: 1,
    },
    contentPadding: {
        padding: 16,
        paddingBottom: 100, // Space for FABs
    },
    fabContainer: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 16, // space-y-4
    },
    fabPrimary: {
        backgroundColor: '#4f46e5', // bg-indigo-600
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    fabIconPrimary: {
        color: '#ffffff', // text-white
    },
    fabSecondary: {
        backgroundColor: '#10b981', // bg-emerald-500
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
    },
    fabIconSecondary: {
        color: '#ffffff', // text-white
    },
    drawerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 10,
    },
    drawer: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: width * 0.75, // w-3/4
        paddingTop: Platform.OS === 'ios' ? 40 : 0, // Adjust for iOS status bar
        zIndex: 20,
    },
    drawerLight: {
        backgroundColor: '#ffffff', // bg-white
    },
    drawerDark: {
        backgroundColor: '#1e293b', // bg-slate-800
    },
    drawerHeader: {
        padding: 16,
        paddingBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0', // border-slate-200
        alignItems: 'center',
    },
    drawerLogo: {
        width: 80, // w-20
        height: 80, // h-20
        marginBottom: 8,
    },
    drawerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1d4ed8', // text-blue-700
    },
    drawerTagline: {
        fontSize: 14,
        color: '#475569', // text-slate-600
    },
    drawerNav: {
        paddingVertical: 8,
    },
    navItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginHorizontal: 8,
        borderRadius: 8,
        marginBottom: 4,
    },
    navItemActiveLight: {
        backgroundColor: '#e0e7ff', // bg-indigo-100
    },
    navItemActiveDark: {
        backgroundColor: '#334155', // bg-slate-700
    },
    navIcon: {
        marginRight: 12,
    },
    navText: {
        fontSize: 16,
        fontWeight: '500',
    },
    navTextActiveLight: {
        color: '#4f46e5', // text-indigo-600
    },
    navTextActiveDark: {
        color: '#93c5fd', // text-blue-300
    },
    drawerFooter: {
        padding: 16,
        borderTopWidth: 1,
        marginTop: 'auto',
    },
    drawerFooterLight: {
        borderTopColor: '#e2e8f0',
        backgroundColor: '#f1f5f9', // bg-slate-100
    },
    drawerFooterDark: {
        borderTopColor: '#334155',
        backgroundColor: '#0f172a', // bg-slate-900
    },
    textDark: {
        color: '#1e293b', // text-slate-900
    },
    textLight: {
        color: '#f8fafc', // text-slate-50
    },
    textSlate400: {
        color: '#94a3b8',
    },
    textSlate600: {
        color: '#475569',
    }
});