export function createCsv(headers: string[], rows: string[][]): string {
  for (const row of rows) {
    if (row.length !== headers.length) {
      throw new Error('Report rows must match the report headers.');
    }
  }

  const lines = [headers, ...rows].map((row) => row.map(escapeCsvCell).join(','));
  return `\uFEFF${lines.join('\r\n')}`;
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function escapeCsvCell(value: string): string {
  const trimmedStart = value.trimStart();
  const spreadsheetSafeValue = /^[=+\-@]/.test(trimmedStart) ? `'${value}` : value;
  return `"${spreadsheetSafeValue.replace(/"/g, '""')}"`;
}
