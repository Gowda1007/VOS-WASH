import { Invoice } from '../types';

export const getWhatsAppMessage = (invoice: Invoice, companyName: string): string => {
    const isKannada = invoice.language === 'kn';
    const totalAmount = invoice.services.reduce((sum, s) => sum + (s.price * s.quantity), 0);
    const date = new Date(invoice.invoiceDate).toLocaleDateString();

    if (isKannada) {
        return `ನಮಸ್ಕಾರ ${invoice.customerName},
    
ನಿಮ್ಮ ಇನ್ವಾಯ್ಸ್ ${invoice.invoiceNumber} ಸಿದ್ಧವಾಗಿದೆ.
ದಿನಾಂಕ: ${date}
ಒಟ್ಟು ಮೊತ್ತ: ₹${totalAmount}

ಈ ಸಂದೇಶದೊಂದಿಗೆ ಪಿಡಿಎಫ್ (PDF) ಲಗತ್ತಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಪರಿಶೀಲಿಸಿ.

ಧನ್ಯವಾದಗಳು,
${companyName}`;
    } else {
        return `Hello ${invoice.customerName},

Your invoice ${invoice.invoiceNumber} is ready.
Date: ${date}
Total Amount: ₹${totalAmount}

Please find the attached PDF.

Thank you,
${companyName}`;
    }
};
