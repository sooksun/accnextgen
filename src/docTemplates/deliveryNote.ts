import { baseTemplate, pdfNumber, pdfDate } from "./base";

interface DeliveryNoteData {
  number: string;
  issueDate: Date | string;
  customer: { name: string; taxId?: string | null; address?: string | null };
  items?: { name: string; qty: number; unitPrice: number | string; lineTotal: number | string }[];
  subTotal: number | string;
  vatRate: number | string;
  vatAmount: number | string;
  grandTotal: number | string;
  note?: string | null;
  company: { name: string; taxId: string; address: string; branch: string };
}

export function renderDeliveryNote(data: DeliveryNoteData): string {
  const itemsHtml = (data.items ?? [])
    .map(
      (item, idx) => `
    <tr>
      <td class="text-center">${idx + 1}</td>
      <td>${item.name}</td>
      <td class="text-center">${item.qty}</td>
      <td class="text-right">${pdfNumber(item.unitPrice)}</td>
      <td class="text-right">${pdfNumber(item.lineTotal)}</td>
    </tr>`
    )
    .join("");

  const content = `
    <div class="header">
      <div class="company-info">
        <div class="company-name">${data.company.name}</div>
        <div class="company-detail">${data.company.address}</div>
        <div class="company-detail">เลขผู้เสียภาษี: ${data.company.taxId} สาขา: ${data.company.branch}</div>
      </div>
      <div class="doc-info">
        <div class="doc-type" style="color:#ca8a04">ใบส่งสินค้า</div>
        <div class="doc-number">เลขที่: ${data.number}</div>
        <div class="doc-number">วันที่: ${pdfDate(data.issueDate)}</div>
      </div>
    </div>

    <div class="customer-section">
      <h3>ส่งถึง</h3>
      <div class="customer-name">${data.customer.name}</div>
      ${data.customer.taxId ? `<div class="customer-detail">เลขผู้เสียภาษี: ${data.customer.taxId}</div>` : ""}
      ${data.customer.address ? `<div class="customer-detail">${data.customer.address}</div>` : ""}
    </div>

    <table class="items">
      <thead>
        <tr>
          <th class="text-center" style="width:50px">ลำดับ</th>
          <th>รายการ</th>
          <th class="text-center" style="width:60px">จำนวน</th>
          <th class="text-right" style="width:120px">ราคาต่อหน่วย</th>
          <th class="text-right" style="width:120px">จำนวนเงิน</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="totals">
      <table>
        <tr>
          <td>ยอดรวม</td>
          <td class="text-right">${pdfNumber(data.grandTotal)}</td>
        </tr>
      </table>
    </div>

    ${data.note ? `<div class="note">หมายเหตุ: ${data.note}</div>` : ""}

    <div class="footer">
      <p style="font-size:12px; color:#666;">ได้รับสินค้าครบถ้วนถูกต้องแล้ว</p>
      <div class="signatures">
        <div class="signature-box">
          <div class="signature-line">ผู้จัดส่ง</div>
        </div>
        <div class="signature-box">
          <div class="signature-line">ผู้รับสินค้า</div>
        </div>
      </div>
    </div>
  `;

  return baseTemplate(content, `ใบส่งสินค้า ${data.number}`);
}
