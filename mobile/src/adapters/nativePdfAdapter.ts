import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Paths, File } from 'expo-file-system';
import type { PdfAdapter, PdfGenerationOptions, PdfResult } from '../core/adapters/pdfAdapter';
import { calculateInvoiceTotal, calculateTotalDue, calculateTotalPaid, formatCurrency } from '../core';

export class NativePdfAdapter implements PdfAdapter {
  async generateInvoicePdf(options: PdfGenerationOptions): Promise<PdfResult> {
    try {
      const html = this.generateInvoiceHTML(options);
      
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      const fileName = `Invoice_${options.invoice.invoiceNumber}.pdf`;
      
      // Move to permanent storage
      const permanentUri = await this.savePdfToDevice(uri, fileName);

      return {
        filePath: permanentUri,
        fileName,
        success: true,
      };
    } catch (error) {
      return {
        fileName: '',
        success: false,
        error: error instanceof Error ? error.message : 'PDF generation failed',
      };
    }
  }

  async savePdfToDevice(filePath: string, fileName: string): Promise<string> {
     const destFile = new File(Paths.document, fileName);
     const sourceFile = new File(filePath);
     await sourceFile.copy(destFile);
     return destFile.uri;
  }

  async openPdf(filePath: string): Promise<void> {
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(filePath);
    }
  }

  private generateInvoiceHTML(options: PdfGenerationOptions): string {
    const { invoice, companyName, companyAddress, companyPhone, companyEmail, gstNumber } = options;
    const total = calculateInvoiceTotal(invoice.services);
    const totalDue = calculateTotalDue(invoice);
    const totalPaid = calculateTotalPaid(invoice);
    const balance = Math.max(0, totalDue - totalPaid);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 20px; color: #333; }
          .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 20px; }
          .company-name { font-size: 24px; font-weight: bold; color: #2563eb; margin-bottom: 5px; }
          .company-details { font-size: 12px; color: #666; }
          .invoice-title { font-size: 20px; font-weight: bold; margin: 20px 0; text-align: center; }
          .info-section { display: flex; justify-content: space-between; margin: 20px 0; }
          .info-box { width: 48%; }
          .info-label { font-size: 10px; color: #666; text-transform: uppercase; margin-bottom: 5px; }
          .info-value { font-size: 14px; font-weight: 600; }
          .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .table th { background: #f3f4f6; padding: 10px; text-align: left; font-size: 12px; border-bottom: 2px solid #ddd; }
          .table td { padding: 10px; font-size: 12px; border-bottom: 1px solid #eee; }
          .totals { margin-top: 20px; text-align: right; }
          .total-row { display: flex; justify-content: flex-end; padding: 5px 0; font-size: 12px; }
          .total-label { width: 150px; text-align: right; padding-right: 20px; }
          .total-value { width: 100px; text-align: right; font-weight: 600; }
          .grand-total { font-size: 16px; font-weight: bold; color: #2563eb; border-top: 2px solid #2563eb; padding-top: 10px; margin-top: 10px; }
          .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #eee; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">${companyName}</div>
          <div class="company-details">${companyAddress}</div>
          <div class="company-details">Phone: ${companyPhone} | Email: ${companyEmail}</div>
          ${gstNumber ? `<div class="company-details">GST: ${gstNumber}</div>` : ''}
        </div>

        <div class="invoice-title">TAX INVOICE</div>

        <div class="info-section">
          <div class="info-box">
            <div class="info-label">Bill To:</div>
            <div class="info-value">${invoice.customerName}</div>
            <div class="info-value">${invoice.customerPhone}</div>
            ${invoice.customerAddress ? `<div class="info-value">${invoice.customerAddress}</div>` : ''}
          </div>
          <div class="info-box" style="text-align: right;">
            <div class="info-label">Invoice Details:</div>
            <div class="info-value">Invoice #: ${invoice.invoiceNumber}</div>
              <div class="info-value">Date: ${new Date().toLocaleDateString()}</div>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Service Description</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.services.map((service, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${service.name}</td>
                <td>${service.quantity}</td>
                <td>${formatCurrency(service.price / service.quantity)}</td>
                <td>${formatCurrency(service.price)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row">
            <div class="total-label">Subtotal:</div>
            <div class="total-value">${formatCurrency(total / 1.18)}</div>
          </div>
          <div class="total-row">
            <div class="total-label">GST (18%):</div>
            <div class="total-value">${formatCurrency(total - (total / 1.18))}</div>
          </div>
            ${invoice.oldBalance && typeof invoice.oldBalance.amount === 'number' ? `
            <div class="total-row">
              <div class="total-label">Previous Balance:</div>
                <div class="total-value">${formatCurrency(invoice.oldBalance.amount)}</div>
            </div>
          ` : ''}
            ${invoice.advancePaid && typeof invoice.advancePaid.amount === 'number' ? `
            <div class="total-row">
              <div class="total-label">Advance:</div>
                <div class="total-value">- ${formatCurrency(invoice.advancePaid.amount)}</div>
            </div>
          ` : ''}
          <div class="total-row grand-total">
            <div class="total-label">Total Due:</div>
            <div class="total-value">${formatCurrency(totalDue)}</div>
          </div>
          ${totalPaid > 0 ? `
            <div class="total-row">
              <div class="total-label">Amount Paid:</div>
              <div class="total-value">${formatCurrency(totalPaid)}</div>
            </div>
            <div class="total-row grand-total">
              <div class="total-label">Balance:</div>
              <div class="total-value">${formatCurrency(balance)}</div>
            </div>
          ` : ''}
        </div>

        ${invoice.payments && invoice.payments.length > 0 ? `
          <div style="margin-top: 30px;">
            <h3 style="font-size: 14px; margin-bottom: 10px;">Payment History:</h3>
            <table class="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.payments.map(payment => `
                  <tr>
                    <td>${new Date(payment.date).toLocaleDateString()}</td>
                    <td>${payment.method}</td>
                    <td>${payment.referenceNumber || '-'}</td>
                    <td>${formatCurrency(payment.amount)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        <div class="footer">
          <p>Thank you for your business!</p>
          <p>This is a computer-generated invoice and does not require a signature.</p>
        </div>
      </body>
      </html>
    `;
  }

  async generateSimpleListPdf(options: { title: string; columns: string[]; rows: string[][]; fileName?: string }): Promise<PdfResult> {
    try {
      const { title, columns, rows } = options;
      const fileName = options.fileName || `${title.replace(/\s+/g, '_')}.pdf`;
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /><style>
        body { font-family: 'Helvetica','Arial',sans-serif; padding:24px; color:#111; }
        h1 { font-size:20px; margin:0 0 16px; color:#2563eb; }
        table { width:100%; border-collapse:collapse; }
        th { background:#f3f4f6; text-align:left; padding:8px; font-size:12px; border-bottom:2px solid #ddd; }
        td { padding:8px; font-size:12px; border-bottom:1px solid #eee; }
        tr:nth-child(even) td { background:#fafafa; }
      </style></head><body>
        <h1>${title}</h1>
        <table><thead><tr>${columns.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>
        ${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}
        </tbody></table>
      </body></html>`;

      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const savedUri = await this.savePdfToDevice(uri, fileName);
      return { filePath: savedUri, fileName, success: true };
    } catch (error) {
      return { fileName: options.fileName || 'list.pdf', success: false, error: error instanceof Error ? error.message : 'List PDF generation failed' };
    }
  }
}
