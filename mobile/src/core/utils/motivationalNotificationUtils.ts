import motivationalQuotes from '../../assets/kannadaMotivationalNotifications.json';
import { AppMetrics } from './appMetricsFetcher';

interface MotivationalQuote {
  id: number;
  title: string;
  body: string;
}

type NotificationTime = 'morning' | 'evening';

/**
 * Selects a random motivational quote based on the time of day.
 */
function getRandomMotivationalQuote(time: NotificationTime): MotivationalQuote {
  const quotes = motivationalQuotes[time];
  const randomIndex = Math.floor(Math.random() * quotes.length);
  return quotes[randomIndex];
}

/**
 * Gets the motivational quote data for scheduling based on time.
 * @param time 'morning' or 'evening'
 * @param metrics App metrics containing counts for pending orders, unpaid invoices, etc.
 * @returns { title: string, body: string }
 */
export function getMotivationalNotificationContent(time: NotificationTime, metrics: AppMetrics): { title: string; body: string } {
    const quote = getRandomMotivationalQuote(time);
    let body = quote.body;

    // Substitute placeholders with real-time data
    body = body.replace(/{{PENDING_ORDERS_COUNT}}/g, String(metrics.pendingOrdersCount || 0));
    body = body.replace(/{{UNPAID_INVOICES_COUNT}}/g, String(metrics.unpaidInvoicesCount || 0));
    body = body.replace(/{{LOW_STOCK_COUNT}}/g, String(metrics.lowStockItemsCount || 0));
    // Note: totalUnpaidAmount could also be substituted if currency formatting was available here.

    return {
        title: quote.title,
        body: body,
    };
}