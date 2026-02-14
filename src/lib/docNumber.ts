import { prisma } from "./prisma";
import type { DocType } from "@prisma/client";

/**
 * Document Number Generator
 * รูปแบบ: PREFIX-YYMM-NNNN (เช่น QT-2602-0001, INV-2602-0002, TX-2602-0001)
 */

const DOC_PREFIX_MAP: Record<DocType, string> = {
  QUOTATION: "QT",
  INVOICE: "INV",
  TAX_INVOICE_RECEIPT: "TX",
  DELIVERY_NOTE: "DN",
};

/**
 * สร้างเลขเอกสารถัดไปอัตโนมัติ
 * @param type - ประเภทเอกสาร
 * @param date - วันที่ออกเอกสาร (ใช้หา prefix เดือน/ปี)
 */
export async function generateDocNumber(
  type: DocType,
  date: Date = new Date()
): Promise<string> {
  // ลอง load prefix จาก Setting table ก่อน
  const prefixKey = `DOC_PREFIX_${type === "QUOTATION" ? "QUOT" : type === "INVOICE" ? "INV" : type === "DELIVERY_NOTE" ? "DN" : "TAX"}`;
  const setting = await prisma.setting.findUnique({
    where: { key: prefixKey },
  });

  const prefix = setting?.value ?? DOC_PREFIX_MAP[type];
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const monthPrefix = `${prefix}-${yy}${mm}-`;

  // หาเลขล่าสุดในเดือนนั้น
  const lastDoc = await prisma.document.findFirst({
    where: {
      number: { startsWith: monthPrefix },
    },
    orderBy: { number: "desc" },
    select: { number: true },
  });

  let nextSeq = 1;
  if (lastDoc) {
    const lastSeq = parseInt(lastDoc.number.split("-").pop() ?? "0", 10);
    nextSeq = lastSeq + 1;
  }

  return `${monthPrefix}${String(nextSeq).padStart(4, "0")}`;
}

/**
 * สร้างเลข Order Code ถัดไป
 * รูปแบบ: ORD-YYMM-NNNN
 */
export async function generateOrderCode(
  date: Date = new Date()
): Promise<string> {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const monthPrefix = `ORD-${yy}${mm}-`;

  const lastOrder = await prisma.order.findFirst({
    where: {
      code: { startsWith: monthPrefix },
    },
    orderBy: { code: "desc" },
    select: { code: true },
  });

  let nextSeq = 1;
  if (lastOrder) {
    const lastSeq = parseInt(lastOrder.code.split("-").pop() ?? "0", 10);
    nextSeq = lastSeq + 1;
  }

  return `${monthPrefix}${String(nextSeq).padStart(4, "0")}`;
}

/**
 * สร้างเลข Project Code ถัดไป
 * รูปแบบ: PRJ-YYMM-NNNN
 */
export async function generateProjectCode(
  date: Date = new Date()
): Promise<string> {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const monthPrefix = `PRJ-${yy}${mm}-`;

  const lastProject = await prisma.project.findFirst({
    where: {
      code: { startsWith: monthPrefix },
    },
    orderBy: { code: "desc" },
    select: { code: true },
  });

  let nextSeq = 1;
  if (lastProject) {
    const lastSeq = parseInt(lastProject.code.split("-").pop() ?? "0", 10);
    nextSeq = lastSeq + 1;
  }

  return `${monthPrefix}${String(nextSeq).padStart(4, "0")}`;
}
