/**
 * Base HTML template สำหรับ PDF A4
 */

export function baseTemplate(content: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Sarabun', sans-serif;
      font-size: 14px;
      color: #333;
      padding: 20mm;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 15px;
    }

    .company-info {
      flex: 1;
    }

    .company-name {
      font-size: 18px;
      font-weight: 700;
      color: #1e40af;
    }

    .company-detail {
      font-size: 12px;
      color: #666;
      margin-top: 4px;
    }

    .doc-info {
      text-align: right;
    }

    .doc-type {
      font-size: 20px;
      font-weight: 700;
      color: #1e40af;
    }

    .doc-number {
      font-size: 14px;
      margin-top: 4px;
    }

    .customer-section {
      margin-bottom: 20px;
      padding: 12px;
      background: #f8fafc;
      border-radius: 8px;
    }

    .customer-section h3 {
      font-size: 13px;
      color: #64748b;
      margin-bottom: 8px;
    }

    .customer-name {
      font-size: 16px;
      font-weight: 600;
    }

    .customer-detail {
      font-size: 12px;
      color: #666;
    }

    table.items {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }

    table.items th {
      background: #1e40af;
      color: white;
      padding: 10px 8px;
      text-align: left;
      font-weight: 500;
      font-size: 13px;
    }

    table.items td {
      padding: 8px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 13px;
    }

    table.items tr:nth-child(even) {
      background: #f8fafc;
    }

    .text-right {
      text-align: right;
    }

    .text-center {
      text-align: center;
    }

    .totals {
      float: right;
      width: 300px;
    }

    .totals table {
      width: 100%;
      border-collapse: collapse;
    }

    .totals td {
      padding: 6px 8px;
      font-size: 14px;
    }

    .totals .grand-total {
      font-size: 18px;
      font-weight: 700;
      color: #1e40af;
      border-top: 2px solid #1e40af;
    }

    .footer {
      clear: both;
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }

    .signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
    }

    .signature-box {
      text-align: center;
      width: 200px;
    }

    .signature-line {
      border-top: 1px solid #333;
      margin-top: 50px;
      padding-top: 5px;
      font-size: 12px;
    }

    .note {
      margin-top: 20px;
      font-size: 12px;
      color: #666;
      font-style: italic;
    }
  </style>
</head>
<body>
  ${content}
</body>
</html>`;
}

/**
 * Format number for PDF
 */
export function pdfNumber(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return num.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format date for PDF
 */
export function pdfDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
