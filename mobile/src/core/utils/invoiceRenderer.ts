import type { Invoice, Language } from '../types';
import { formatCurrency, calculateInvoiceTotalsFromInvoice, formatInvoiceDate } from './invoiceUtils';
import { invoiceLayout, pdfScale } from '../invoiceLayout';

export interface InvoiceRenderData {
  invoice: Invoice;
  language: Language;
  translate: (key: string) => string;
  company: {
    name: string;
    tagline: string;
    address: string;
    phone: string;
    email?: string;
    gstNumber?: string;
  };
  images?: {
    logoB64?: string;
    bannerB64?: string;
  };
}

export type InvoiceCalculations = ReturnType<typeof calculateInvoiceTotalsFromInvoice>;

const capitalizeWords = (str: string): string => {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

const formatDateForDisplay = (dateStr: string | undefined): string => {
  if (!dateStr) return '';
  const core = formatInvoiceDate(dateStr);
  return core ? `(${core})` : '';
};

const isToday = (dateStr: string | undefined): boolean => {
  if (!dateStr) return false;
  const dateOnlyStr = dateStr.split(' ')[0].split('T')[0];
  let year: number, month: number, day: number;

  if (dateOnlyStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const parts = dateOnlyStr.split('-');
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) - 1;
    day = parseInt(parts[2], 10);
  } else if (dateOnlyStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
    const parts = dateOnlyStr.split('/');
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) - 1;
    year = parseInt(parts[2], 10);
  } else {
    return false;
  }

  const inputDate = new Date(year, month, day);
  const today = new Date();
  return inputDate.getFullYear() === today.getFullYear() &&
    inputDate.getMonth() === today.getMonth() &&
    inputDate.getDate() === today.getDate();
};

const getPaymentLabel = (labelKey: string, date: string | undefined, translate: (key: string) => string): { label: string; dateStr: string } => {
  if (!date) {
    return { label: translate(labelKey), dateStr: '' };
  }

  // For payment and advance-paid: check if today
  if (labelKey === 'payment' || labelKey === 'advance-paid') {
    if (isToday(date)) {
      return { label: translate('now-paid'), dateStr: '' };
    } else {
      return { label: translate('paid'), dateStr: formatDateForDisplay(date) };
    }
  }

  // For old-balance and others: just show date
  return { label: translate(labelKey), dateStr: formatDateForDisplay(date) };
};

export const generateInvoiceHTML = (data: InvoiceRenderData, calcs: InvoiceCalculations, scale: number = pdfScale): string => {
  const { invoice, translate: tr, company, images } = data;
  const { subtotal, tax, discount, serviceTotal, oldBalance, advancePaid, paymentsTotal, totalDue, balance } = calcs;

  // Responsive sizing
  const fsBusiness = 16 * scale;      // businessName (slightly larger)
  const fsTagline = 7 * scale;         // tagline (slightly smaller)
  const fsSectionTitle = 8 * scale;    // section title
  const fsCustomerName = 10 * scale;   // customer name bold
  const fsInfo = 8 * scale;            // invoice details values
  const fsTableHeader = 8 * scale;     // table header
  const fsTableCell = 7 * scale;       // table cell
  const fsServiceCell = 6 * scale;     // service name smaller
  const fsSummary = 9 * scale;         // summary labels/values
  const fsGrand = 11 * scale;          // grand total / balance labels
  const fsFooter = 8 * scale;          // footer text

  const logoSize = invoiceLayout.logoSize * scale; // 36 * scale
  const bannerHeight = invoiceLayout.logoSize * scale; // match RN banner height
  const padding = 16 * scale;           // page padding for A4 look
  const primary = '#3b82f6';            // theme.colors.primary
  const primaryDark = '#2563eb';        // theme.colors.primaryDark
  const text = '#0f172a';               // theme.colors.text
  const textSecondary = '#64748b';      // theme.colors.textSecondary
  const border = '#e2e8f0';             // theme.colors.border
  const borderLight = '#f1f5f9';        // theme.colors.borderLight

  // Normalize tagline
  const rawTagline = company.tagline;
  const normalizedTagline = rawTagline.replace(/^\((.*)\)$/, '$1');

  // Build services table rows
  let servicesRows = '';
  invoice.services.forEach((service, index) => {
    const unitPrice = service.quantity ? (service.price / service.quantity) : service.price;
    const itemTotal = service.price;
    const bgColor = index % 2 === 0 ? '#f0f7ff' : '#ffffff';
    servicesRows += `
      <tr style="background: ${bgColor}; border-bottom: 1px solid ${borderLight};">
        <td style="padding: ${3 * scale}px ${4 * scale}px; font-size: ${fsTableCell}px;">${index + 1}</td>
        <td style="padding: ${3 * scale}px ${4 * scale}px; font-size: ${fsServiceCell}px;">${tr(service.name)}</td>
        <td style="padding: ${3 * scale}px ${4 * scale}px; font-size: ${fsTableCell}px; text-align: center;">${service.quantity}</td>
        <td style="padding: ${3 * scale}px ${4 * scale}px; font-size: ${fsTableCell}px; text-align: right;">₹${unitPrice.toFixed(2)}</td>
        <td style="padding: ${3 * scale}px ${4 * scale}px; font-size: ${fsTableCell}px; text-align: right; font-weight: 600;">₹${itemTotal.toFixed(2)}</td>
      </tr>`;
  });
  // Build financial summary flags
  const showOld = oldBalance > 0;
  const showAdv = advancePaid > 0;
  const showPaid = paymentsTotal > 0;
  const hasFinancialDetails = showOld || showAdv || showPaid;

  const hasValidGst = Boolean(company.gstNumber);

  // Complete HTML structure
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        @page { size: A4; margin: 5mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { height: 100%; }
        body { font-family: 'Helvetica','Arial',sans-serif; color: ${text}; background: white; margin: 0; }
        @media print {
          .footer { position: fixed; bottom: 0; }
        }
        .page {
          padding: ${padding}px;
          width: 100%;
          margin: 0 auto;
          min-height: calc(297mm - 10mm);
          display: flex;
          flex-direction: column;
        }
        .content { flex: 1; margin-bottom: ${60 * scale}px; }
        .header {
          text-align: center;
          padding-bottom: ${4 * scale}px;
          margin-bottom: ${4 * scale}px;
          border-bottom: 1px solid ${border};
        }
        .banner {
          height: ${bannerHeight}px;
          width: auto;
          margin: 0 auto 8px auto;
          transform: translateX(${8 * scale}px);
          object-fit: contain;
        }
        .logo-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: ${8 * scale}px;
        }
        .logo {
          width: ${logoSize}px;
          height: ${logoSize}px;
          object-fit: contain;
        }
        .company-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end; /* align text to right side under VOSWASH */
          text-align: right;
        }
        .company-name {
          font-size: ${fsBusiness}px;
          font-weight: 700;
          color: ${primary};
          line-height: 1.2;
        }
        .tagline {
          font-size: ${fsTagline}px;
          color: ${textSecondary};
          margin-top: 2px;
          text-align: right;
          font-weight: 600;
        }
        /* No large invoice title; match preview */
        .info-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: ${8 * scale}px;
        }
        .info-box { flex: 1; }
        .info-right { text-align: right; }
        .section-title {
          font-size: ${fsSectionTitle}px;
          font-weight: 700;
          color: ${textSecondary};
          margin-bottom: 4px;
        }
        .info-label {
          font-size: ${fsSectionTitle}px;
          color: ${textSecondary};
          text-transform: uppercase;
          font-weight: 600;
        }
        .info-value {
          font-size: ${fsInfo}px;
          font-weight: 600;
          color: ${text};
        }
        .business-address {
          padding-top: ${4 * scale}px;
          border-top: 1px dashed ${border};
          margin-top: ${4 * scale}px;
          font-size: ${fsTagline}px;
          color: ${textSecondary};
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: ${8 * scale}px 0;
          border: 1px solid ${primary};
          border-radius: ${4 * scale}px;
          overflow: hidden;
        }
        thead th {
          background: ${primary};
          color: white;
          padding: ${4 * scale}px;
          font-size: ${fsTableHeader}px;
          font-weight: 600;
          text-align: left;
        }
        thead th:nth-child(3),
        tbody td:nth-child(3) { text-align: center; }
        thead th:nth-child(4),
        thead th:nth-child(5),
        tbody td:nth-child(4),
        tbody td:nth-child(5) { text-align: right; }
        tbody td {
          padding: ${3 * scale}px ${4 * scale}px;
          font-size: ${fsTableCell}px;
          border-bottom: 1px solid ${borderLight};
          color: ${text};
        }
        .summary {
          display: flex;
          justify-content: flex-end;
          margin-top: ${3 * scale}px;
        }
        .summary-content {
          width: 35%;
          min-width: 200px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: ${1.5 * scale}px;
          font-size: ${fsSummary}px;
          color: ${textSecondary};
        }
        .summary-divider {
          border-bottom: 1px dashed #9ca3af;
          margin: ${2 * scale}px 0;
        }
        .grand-total {
          display: flex;
          justify-content: space-between;
          padding: ${2 * scale}px;
          margin-top: ${1.5 * scale}px;
          border-top: 2px solid ${primary};
          font-size: ${fsSummary}px;
          font-weight: 600;
          color: ${primary};
        }
        .footer {
          width: 100%;
          padding: ${4 * scale}px ${padding}px;
          border-top: 1px solid ${border};
          text-align: center;
          font-size: ${fsFooter}px;
          color: ${textSecondary};
          page-break-inside: avoid;
          margin-top: auto;
        }
        .footer-services {
          margin-top: ${2 * scale}px;
          color: ${primary};
          font-weight: 500;
          font-size: ${fsTagline}px;
          line-height: 1.2;
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="content">
          <div class="header">
            ${images?.bannerB64 ? `<img class="banner" src="data:image/png;base64,${images.bannerB64}" alt="Banner" />` : ''}
            <div class="logo-row">
              ${images?.logoB64 ? `<img class="logo" src="data:image/png;base64,${images.logoB64}" alt="Logo" />` : ''}
              <div class="company-info">
                <div class="company-name">${company.name}</div>
                <div class="tagline">(${normalizedTagline})</div>
              </div>
            </div>
          </div>

          

          <div class="info-section">
            <div class="info-box">
              <div class="section-title">${tr('bill-to')}</div>
              <div class="info-value" style="font-size:${fsCustomerName}px;">${capitalizeWords(invoice.customerName)}</div>
              <div class="info-value">${invoice.customerPhone}</div>
              ${invoice.customerAddress && invoice.customerAddress !== 'N/A' ? `<div class="info-value">${invoice.customerAddress}</div>` : ''}
              ${invoice.customerGstNumber ? `<div class="info-value" style="margin-top:2px; font-weight:600;">GSTIN: ${invoice.customerGstNumber}</div>` : ''}
            </div>
            <div class="info-box info-right">
              <div class="section-title">${tr('invoice-details')}</div>
              <div class="info-value" style="white-space: nowrap;">${tr('invoice-number')}: #${invoice.invoiceNumber}</div>
              <div class="info-value" style="white-space: nowrap;">${tr('date')}: ${invoice.invoiceDate ? formatInvoiceDate(invoice.invoiceDate) : formatInvoiceDate(new Date().toISOString().slice(0, 10))}</div>
              <div class="business-address">
                <div><strong>${tr('business-address')}</strong></div>
                <div>${company.address}</div>
                <div>${company.phone}${company.email ? ` | ${company.email}` : ''}</div>
                ${company.gstNumber ? `<div>${tr('gst-number-label')}: ${company.gstNumber}</div>` : ''}
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>${tr('sl-no')}</th>
                <th>${tr('service')}</th>
                <th>${tr('qty')}</th>
                <th>${tr('price')}</th>
                <th>${tr('amount-header')}</th>
              </tr>
            </thead>
            <tbody>
              ${servicesRows}
            </tbody>
          </table>

          <div class="summary">
            <div class="summary-content">
              <div class="summary-row">
                <span>${tr('subtotal')}</span>
                <span>₹${subtotal.toFixed(2)}</span>
              </div>
              <div class="summary-row">
                <span>${tr('gst')}</span>
                <span>+ ₹${tax.toFixed(2)}</span>
              </div>
              ${discount > 0 ? `
              <div class="summary-row">
                <span>${tr('discount') || 'Discount'}</span>
                <span>- ₹${discount.toFixed(2)}</span>
              </div>` : ''}
              <div class="summary-divider"></div>
              <div class="grand-total" style="background-color: ${hasFinancialDetails ? '#dbeafe' : '#dbeafe'}; padding: ${2 * scale}px; border-radius: ${2 * scale}px;">
                <span>${hasFinancialDetails ? tr('summary-total') : tr('summary-grand-total')}</span>
                <span>₹${totalDue.toFixed(2)}</span>
              </div>
              ${hasFinancialDetails ? `
              <div style="margin-top: ${1.5 * scale}px; padding-top: ${1.5 * scale}px; border-top: 1px dashed ${border}; border-bottom: 1px dashed ${border}; padding-bottom: ${1.5 * scale}px;">
                ${showOld ? `
                <div class="summary-row" style="color:#b91c1c; margin-bottom: ${1.5 * scale}px;">
                  <span>${tr('old-balance')} ${invoice.oldBalance?.date ? formatDateForDisplay(invoice.oldBalance.date) : ''}</span>
                  <span>+ ₹${oldBalance.toFixed(2)}</span>
                </div>` : ''}
                ${showAdv ? `
                <div class="summary-row" style="color:#065f46; margin-bottom: ${1.5 * scale}px;">
                  <span>${(() => { const l = getPaymentLabel('advance-paid', invoice.advancePaid?.date, tr); return `${l.label} ${l.dateStr}`; })()}</span>
                  <span>- ₹${advancePaid.toFixed(2)}</span>
                </div>` : ''}
                ${(invoice.payments || []).map((p: any) => {
    const pLabel = getPaymentLabel('payment', p.date, tr);
    return `
                <div class="summary-row" style="color:#1e40af; margin-bottom: ${1.5 * scale}px;">
                  <span>${pLabel.label} ${pLabel.dateStr}</span>
                  <span>- ₹${(Number(p.amount) || 0).toFixed(2)}</span>
                </div>`;
  }).join('')}
              </div>` : ''}
              ${showPaid || hasFinancialDetails ? `
              <div class="grand-total" style="border-top:2px solid #2563eb; background-color: #dbeafe; padding: ${2 * scale}px; border-radius: ${2 * scale}px; margin-top: ${1.5 * scale}px;">
                <span>${(showOld || showAdv || showPaid) ? tr('summary-balance') : tr('summary-grand-total')}</span>
                <span>₹${balance.toFixed(2)}</span>
              </div>` : ''}
            </div>
          </div>
        </div>

        <div class="footer">
          <p>${tr('footer-generated')}</p>
          <p>${tr('footer-thanks')}</p>
          <p class="footer-services">${tr('footer-services')}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
