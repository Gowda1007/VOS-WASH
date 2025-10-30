import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, ScrollView, Dimensions } from 'react-native';
import type { Invoice, Language } from '../types';
import { InvoicePreview } from './InvoicePreview';
import { Button, Icon } from './Common';
import { useToast } from '../hooks/useToast';
import { downloadPDF } from '../services/pdfService'; // This will trigger native Alert
import { calculateRemainingBalance } from '../hooks/useInvoices';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';

const { width, height } = Dimensions.get('window');

interface InvoicePreviewOverlayProps {
  invoice: Invoice;
  onClose: () => void;
  // Fix: Change prop type to accept the full Invoice object
  onCollect: (invoice: Invoice) => void;
}

interface InvoiceLanguageToggleProps {
  value: Language;
  onChange: (lang: Language) => void;
  isDarkMode: boolean;
}

const InvoiceLanguageToggle: React.FC<InvoiceLanguageToggleProps> = ({ value, onChange, isDarkMode }) => {
    const { t } = useLanguage();
    return (
        <View style={[styles.langToggleContainer, isDarkMode ? styles.bgSlate700 : styles.bgSlate200]}>
            <TouchableOpacity onPress={() => onChange('en')} style={[styles.langToggleButton, value === 'en' && (isDarkMode ? styles.langToggleActiveDark : styles.langToggleActiveLight)]}>
                <Text style={styles.langToggleButtonText}>{t('english')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onChange('kn')} style={[styles.langToggleButton, value === 'kn' && (isDarkMode ? styles.langToggleActiveDark : styles.langToggleActiveLight)]}>
                <Text style={styles.langToggleButtonText}>{t('kannada')}</Text>
            </TouchableOpacity>
        </View>
    );
};

export const InvoicePreviewOverlay: React.FC<InvoicePreviewOverlayProps> = ({ invoice, onClose, onCollect }) => {
    const toast = useToast();
    const { t } = useLanguage();
    const { resolvedTheme } = useTheme();
    const isDarkMode = resolvedTheme === 'dark';
    const balanceDue = calculateRemainingBalance(invoice);
    const [invoiceLanguage, setInvoiceLanguage] = useState<Language>(invoice.language || 'en');

    const handleDownload = async () => {
        // pdfService.ts already has an Alert stub for downloadPDF
        await downloadPDF(invoice); 
    };

    return (
        <View style={styles.overlay} >
            <TouchableOpacity 
                style={styles.overlayTouchable} 
                activeOpacity={1} 
                onPress={onClose} 
            >
                <View 
                    style={[styles.modalContent, isDarkMode ? styles.bgSlate900 : styles.bgSlate100]}
                    onTouchStart={e => e.stopPropagation()} // Prevent closing when interacting with modal content
                >
                    <View style={styles.headerControls}>
                        <InvoiceLanguageToggle value={invoiceLanguage} onChange={setInvoiceLanguage} isDarkMode={isDarkMode}/>
                        <TouchableOpacity 
                            onPress={onClose} 
                            style={[styles.closeButton, isDarkMode ? styles.closeButtonDark : styles.closeButtonLight]}
                            accessibilityLabel="Close preview"
                        >
                            <Icon name="x-mark" size={24} style={isDarkMode ? styles.iconDark : styles.iconLight}/>
                        </TouchableOpacity>
                    </View>
                    
                    <ScrollView style={[styles.invoicePreviewArea, isDarkMode ? styles.bgSlate800 : styles.bgSlate200]}>
                        <InvoicePreview invoiceData={invoice} language={invoiceLanguage} />
                    </ScrollView>

                     <View style={[styles.footerActions, isDarkMode ? styles.borderSlate700 : styles.borderSlate200]}>
                        <Button onPress={handleDownload} style={styles.fullWidthButton}>
                             <Icon name="document-duplicate" size={20} style={isDarkMode ? styles.iconDark : styles.iconLight}/>
                            <Text>{t('download-pdf')}</Text>
                        </Button>
                        {balanceDue > 0 && (
                            <Button 
                                // Fix: Pass the entire invoice object to the onCollect handler
                                onPress={() => onCollect(invoice)} 
                                style={styles.collectPaymentButton}
                            >
                                <Icon name="banknotes" size={20} style={styles.collectPaymentIcon}/> <Text>{t('collect-payment')}</Text>
                            </Button>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)', // bg-black/60
        zIndex: 40,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16, // p-4
    },
    overlayTouchable: {
        flex: 1, // Make it cover the whole area
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '100%', // w-full
        maxWidth: 768, // max-w-4xl
        borderRadius: 8, // rounded-lg
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
        elevation: 5,
        marginVertical: 32, // my-8
        maxHeight: height * 0.9, // Limit height to avoid overflowing screen
        flexDirection: 'column',
    },
    bgSlate100: { backgroundColor: '#f1f5f9' },
    bgSlate900: { backgroundColor: '#0f172a' },

    headerControls: {
        position: 'absolute',
        top: 8, // top-2
        left: 8, // left-2
        right: 8, // right-2
        zIndex: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        // paddingTop: 16, // pt-16
    },
    langToggleContainer: {
        flexDirection: 'row',
        padding: 4, // p-1
        borderRadius: 8, // rounded-lg
    },
    bgSlate200: { backgroundColor: '#e2e8f0' },
    bgSlate700: { backgroundColor: '#334155' },

    langToggleButton: {
        paddingHorizontal: 16, // px-4
        paddingVertical: 6, // py-1.5
        borderRadius: 6, // rounded-md
        // transition - activeOpacity handles it
    },
    langToggleButtonText: {
        fontSize: 14, // text-sm
    },
    langToggleActiveLight: {
        backgroundColor: '#ffffff', // bg-white
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 2,
    },
    langToggleActiveDark: {
        backgroundColor: '#1e293b', // dark:bg-slate-800
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 2,
    },

    closeButton: {
        padding: 8, // p-2
        borderRadius: 9999, // rounded-full
    },
    closeButtonLight: {
        backgroundColor: 'rgba(226, 232, 240, 0.5)', // bg-slate-200/50
    },
    closeButtonDark: {
        backgroundColor: 'rgba(51, 65, 85, 0.5)', // dark:bg-slate-700/50
    },
    iconDark: { color: '#f8fafc' }, // text-white
    iconLight: { color: '#1e293b' }, // text-black or default

    invoicePreviewArea: {
        paddingTop: 64, // pt-16 (to account for header controls)
        paddingHorizontal: 16, // p-4 sm:p-8
        flexGrow: 1,
    },
    bgSlate800: { backgroundColor: '#1e293b' },

    footerActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16, // gap-4
        padding: 16, // p-4
        borderTopWidth: 1,
    },
    borderSlate200: { borderColor: '#e2e8f0' },
    borderSlate700: { borderColor: '#334155' },

    fullWidthButton: {
        flex: 1, // for equal width buttons
    },
    collectPaymentButton: {
        backgroundColor: '#22c55e', // bg-green-600
        flex: 1, // for equal width buttons
    },
    collectPaymentIcon: {
        color: '#ffffff', // text-white
    },
});