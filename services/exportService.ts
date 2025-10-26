function escapeCsvCell(cell: any): string {
    if (cell === null || cell === undefined) {
        return '';
    }
    const str = String(cell);
    // If the string contains a comma, double quote, or newline, wrap it in double quotes.
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        // Also, any double quotes within the string must be escaped by another double quote.
        const escapedStr = str.replace(/"/g, '""');
        return `"${escapedStr}"`;
    }
    return str;
}


export function exportToCSV(headers: string[], data: (string | number)[][], filename: string): void {
    const csvRows: string[] = [];
    
    // Add headers
    csvRows.push(headers.map(escapeCsvCell).join(','));

    // Add data rows
    for (const row of data) {
        csvRows.push(row.map(escapeCsvCell).join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
