import { renderQuotation } from "./quotation";
import { renderInvoice } from "./invoice";
import { renderTaxInvoiceReceipt } from "./taxInvoiceReceipt";
import { renderDeliveryNote } from "./deliveryNote";
import type { DocType } from "@prisma/client";

interface DocumentRenderData {
  type: DocType;
  number: string;
  issueDate: Date | string;
  customer: { name: string; taxId?: string | null; address?: string | null };
  items?: { name: string; qty: number; unitPrice: number | string; lineTotal: number | string }[];
  subTotal: number | string;
  vatRate: number | string;
  vatAmount: number | string;
  grandTotal: number | string;
  note?: string | null;
  wht?: { rate: number | string; baseAmount: number | string; taxAmount: number | string } | null;
  company: { name: string; taxId: string; address: string; branch: string };
}

/**
 * เลือก template ตาม DocType แล้ว render HTML
 */
export function renderDocument(data: DocumentRenderData): string {
  switch (data.type) {
    case "QUOTATION":
      return renderQuotation(data);
    case "INVOICE":
      return renderInvoice(data);
    case "TAX_INVOICE_RECEIPT":
      return renderTaxInvoiceReceipt(data);
    case "DELIVERY_NOTE":
      return renderDeliveryNote(data);
    default:
      throw new Error(`Unknown document type: ${data.type}`);
  }
}
