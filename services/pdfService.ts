import type { Invoice } from "../types";
import html2canvas from 'html2canvas'; // Dynamically imported
import { jsPDF } from 'jspdf'; // Dynamically imported

export const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            // The result is a data URL (e.g., "data:application/pdf;base64,...")
            // We only want the base64 part
            const base64String = (reader.result as string).split(',')[1];
            resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};
// No longer need declare global for window object, import directly
// declare global {
//     interface Window {
//         html2canvas: any;
//         jspdf: any;
//     }
// }

const applyCommonPDFStyles = (element: HTMLElement) => {
    element.style.fontFamily = 'sans-serif';
    element.style.fontSize = '10pt';
    element.style.padding = '15mm'; // A4 margins
    element.style.backgroundColor = '#ffffff';
    element.style.color = '#000000';
};

const generatePdfFromHtmlElement = async (element: HTMLElement, filename: string, outputType: 'datauristring' | 'blob' = 'datauristring'): Promise<string | File | null> => {
    if (!element) {
        throw new Error("Element to print not found.");
    }

    try {
        const canvas = await html2canvas(element, {
            scale: 2,
            logging: false,
            useCORS: true,
            allowTaint: true, // Allow cross-origin content to taint the canvas, potentially fixing image loading issues
            backgroundColor: '#ffffff', // Ensure a white background for consistency
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.9);

        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
        
        if (outputType === 'datauristring') {
            return pdf.output('datauristring');
        } else {
            const pdfBlob = pdf.output('blob');
            return new File([pdfBlob], filename, { type: 'application/pdf' });
        }

    } catch (error) {
        console.error("Error generating PDF:", error);
        throw new Error(`Could not generate PDF: ${error instanceof Error ? error.message : String(error)}`);
    }
};

export const downloadPDF = async (invoiceData: Pick<Invoice, 'invoiceNumber' | 'customerName'>, elementToPrint: HTMLElement | null): Promise<void> => {
    try {
        const filename = `VOS-WASH-Invoice-${invoiceData.invoiceNumber}-${invoiceData.customerName.replace(/ /g, '_')}.pdf`;
        // Generate PDF as a Blob
        const pdfFile = await generatePdfFromHtmlElement(elementToPrint!, filename, 'blob');

        if (pdfFile instanceof File) {
            // Create a temporary URL for the Blob and trigger download
            const url = URL.createObjectURL(pdfFile);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url); // Clean up the object URL
        } else {
            throw new Error("PDF generation failed to produce a file.");
        }
    } catch (error) {
        console.error("Error downloading PDF:", error);
        alert(error instanceof Error ? error.message : "Could not generate PDF. Check console for details.");
    }
};
export const generatePdfAsFile = async (invoiceData: Pick<Invoice, 'invoiceNumber' | 'customerName'>, elementToPrint: HTMLElement | null): Promise<File | null> => {
    try {
        const filename = `VOS-WASH-Invoice-${invoiceData.invoiceNumber}-${invoiceData.customerName.replace(/ /g, '_')}.pdf`;
        const pdfFile = await generatePdfFromHtmlElement(elementToPrint!, filename, 'blob');
        return pdfFile as File;
    } catch (error) {
        alert(error instanceof Error ? error.message : "Could not generate PDF file. Check console for details.");
        return null;
    }
};

const createListHtmlContent = (headers: string[], data: (string | number)[][], title: string): HTMLElement => {
    const tempDiv = document.createElement('div');
    applyCommonPDFStyles(tempDiv); // Apply base styles

    const titleEl = document.createElement('h1');
    titleEl.textContent = title;
    titleEl.style.fontSize = '24pt';
    titleEl.style.fontWeight = 'bold';
    titleEl.style.marginBottom = '20mm';
    titleEl.style.textAlign = 'center';
    tempDiv.appendChild(titleEl);

    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.marginBottom = '10mm';
    table.style.fontSize = '9pt';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.style.backgroundColor = '#f3f4f6'; // Light gray background
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        th.style.border = '1px solid #e2e8f0'; // Light gray border
        th.style.padding = '8px';
        th.style.textAlign = 'left';
        th.style.fontWeight = '600';
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    data.forEach((rowData, rowIndex) => {
        const row = document.createElement('tr');
        row.style.backgroundColor = rowIndex % 2 === 0 ? '#ffffff' : '#fcfdff'; // Alternating row colors
        rowData.forEach(cellData => {
            const td = document.createElement('td');
            td.textContent = String(cellData);
            td.style.border = '1px solid #e2e8f0';
            td.style.padding = '8px';
            td.style.verticalAlign = 'top';
            row.appendChild(td);
        });
        tbody.appendChild(row);
    });
    table.appendChild(tbody);
    tempDiv.appendChild(table);

    return tempDiv;
};

export const downloadListAsPDF = async (headers: string[], data: (string | number)[][], filename: string, title: string): Promise<void> => {
    try {
        const tempElement = createListHtmlContent(headers, data, title);
        document.body.appendChild(tempElement); // Temporarily add to DOM for html2canvas
        const pdfDataUri = await generatePdfFromHtmlElement(tempElement, filename, 'datauristring');
        window.location.href = pdfDataUri as string;
        document.body.removeChild(tempElement); // Clean up
    } catch (error) {
        alert(error instanceof Error ? error.message : "Could not generate PDF. Check console for details.");
    }
};

export const exportListAsFile = async (headers: string[], data: (string | number)[][], filename: string, title: string): Promise<File | null> => {
    try {
        const tempElement = createListHtmlContent(headers, data, title);
        document.body.appendChild(tempElement); // Temporarily add to DOM for html2canvas
        const pdfFile = await generatePdfFromHtmlElement(tempElement, filename, 'blob');
        document.body.removeChild(tempElement); // Clean up
        return pdfFile as File;
    } catch (error) {
        alert(error instanceof Error ? error.message : "Could not generate PDF file. Check console for details.");
        return null;
    }
};