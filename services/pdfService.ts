import type { Invoice } from "../types";

// Add types to window object to avoid TypeScript errors
declare global {
    interface Window {
        html2canvas: any;
        jspdf: any;
    }
}

export const downloadPDF = async (invoiceData: Pick<Invoice, 'invoiceNumber' | 'customerName'>, elementToPrint: HTMLElement | null): Promise<void> => {
    if (!elementToPrint) {
        alert("Cannot download: Element to print not found.");
        return;
    }

    if (!window.html2canvas || !window.jspdf) {
        alert("PDF generation libraries are not loaded.");
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const canvas = await window.html2canvas(elementToPrint, {
            scale: 2,
            logging: false,
            useCORS: true,
            backgroundColor: '#ffffff', // Ensure a white background for consistency
        });

        const imgData = canvas.toDataURL("image/png");

        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        
        // Instead of pdf.save(), generate a data URI.
        // In a browser, this will also trigger a download (though filename may be generic).
        // In our Android WebView, this specific action will be intercepted for native file saving.
        const pdfDataUri = pdf.output('datauristring');
        window.location.href = pdfDataUri;

    } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Could not generate PDF. Check console for details.");
    }
};