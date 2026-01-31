export interface VoiceCommandResult {
    name: string | null;
    phone: string | null;
    service: string | null;
    amount: number | null;
}

/**
 * Parses spoken text to extract structured invoice data.
 * Supports English and Kannada keywords.
 * 
 * Logic:
 * - Looks for keywords acting as anchors (e.g., "Customer", "Phone", "Service").
 * - Extracts text following these anchors.
 * - Handles mixed language (Kanglish).
 */
export const parseVoiceCommand = (text: string): VoiceCommandResult => {
    const lower = text.toLowerCase().trim();

    // --- 1. PHONE PARSING ---
    // Look for 10-digit text that looks like a phone number
    // Regex: Finds 10+ digits, dealing with optional spaces/dashes
    const phoneMatch = lower.match(/(?:phone|mobile|number|ಫೋನ್|ಮೊಬೈಲ್)\D*?(\d[\d\s-]{8,}\d)/i) ||
        lower.match(/(\d{10})/); // Fallback: just find 10 digits

    let phone = phoneMatch ? phoneMatch[1].replace(/\D/g, '') : null;
    // Basic validation for Indian numbers
    if (phone && phone.length > 10) phone = phone.slice(-10);

    // --- 2. NAME PARSING ---
    // Look for text after specific name anchors
    // Anchors: Customer, Name, Grahaka, Hesaru, Invoice for, Bill for
    // Stop at: Phone, Mobile, Service, Kelasa, Amount
    const nameRegex = /(?:customer|name|party|ಗ್ರಾಹಕ|ಹೆಸರು|invoice for|bill for|bill to)\s+(.+?)(?=\s+(?:phone|mobile|number|ಫೋನ್|ಮೊಬೈಲ್|service|kelasa|amount)|$)/i;
    const nameMatch = lower.match(nameRegex);

    let name = nameMatch ? nameMatch[1].trim() : null;

    // Clean up common noise words in name if captured
    if (name) {
        name = name.replace(/^(is|called|named|hesaru)\s+/, '');
    }

    // --- 3. SERVICE PARSING ---
    // Anchors: Service, Work, Kelasa
    const serviceRegex = /(?:service|work|for|ಕೆಲಸ|ಸರ್ವಿಸ್)\s+(.+?)(?=\s+(?:amount|price|cost|phone|mobile)|$)/i;
    const serviceMatch = lower.match(serviceRegex);

    const service = serviceMatch ? serviceMatch[1].trim() : null;

    // --- 4. AMOUNT PARSING (Optional) ---
    const amountMatch = lower.match(/(?:amount|price|cost|belay|bele)\s+(\d+)/i);
    const amount = amountMatch ? parseInt(amountMatch[1], 10) : null;

    return {
        name,
        phone,
        service,
        amount
    };
};

/**
 * Helper to determine if the user is speaking Kannada keywords.
 * Can be used to switch UI hints.
 */
export const isKannadaCommand = (text: string): boolean => {
    const kannadaKeywords = ['ಫೋನ್', 'ಮೊಬೈಲ್', 'ಗ್ರಾಹಕ', 'ಹೆಸರು', 'ಕೆಲಸ', 'ಸರ್ವಿಸ್'];
    return kannadaKeywords.some(kw => text.includes(kw));
};
