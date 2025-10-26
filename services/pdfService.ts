
import type { Invoice } from "../types";

// Add types to window object to avoid TypeScript errors
declare global {
    interface Window {
        html2canvas: any;
        jspdf: any;
    }
}

export const downloadPDF = async (invoiceData: Invoice, invoiceElement: HTMLElement | null): Promise<void> => {
    if (!invoiceElement) {
        alert("Cannot download: Invoice element not found.");
        return;
    }

    if (!window.html2canvas || !window.jspdf) {
        alert("PDF generation libraries are not loaded.");
        return;
    }

    const customerName = invoiceData.customerName.trim().replace(/\s+/g, "_") || "invoice";
    const filename = `VOS-WASH-${invoiceData.invoiceNumber}-${customerName}.pdf`;

    // Temporarily set a specific width for consistent PDF output
    const originalWidth = invoiceElement.style.width;
    invoiceElement.style.width = "800px";

    try {
        const { jsPDF } = window.jspdf;
        const canvas = await window.html2canvas(invoiceElement, {
            scale: 2,
            logging: false,
            useCORS: true,
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
        pdf.save(filename);

    } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Could not generate PDF. Check console for details.");
    } finally {
        // Restore original width
        invoiceElement.style.width = originalWidth;
    }
};
