import { prisma } from "./prisma";

/**
 * Month Lock Guard
 * ตรวจสอบว่าเดือนถูกปิดแล้วหรือยัง ถ้าปิดแล้วห้ามแก้ไข
 */

export class MonthClosedError extends Error {
  constructor(year: number, month: number) {
    super(
      `เดือน ${month}/${year} ถูกปิดแล้ว ไม่สามารถแก้ไขรายการในเดือนนี้ได้`
    );
    this.name = "MonthClosedError";
  }
}

/**
 * ตรวจสอบว่าเดือนถูกปิดแล้วหรือยัง
 * ถ้าปิดแล้วจะ throw MonthClosedError
 *
 * @param date - วันที่ที่ต้องการตรวจสอบ
 * @throws MonthClosedError ถ้าเดือนถูกปิดแล้ว
 */
export async function assertNotClosed(date: Date): Promise<void> {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // JavaScript months are 0-indexed

  const closed = await prisma.monthlyClose.findUnique({
    where: {
      year_month: { year, month },
    },
  });

  if (closed) {
    throw new MonthClosedError(year, month);
  }
}

/**
 * ตรวจสอบว่าเดือนถูกปิดแล้วหรือยัง (ไม่ throw)
 * @returns true ถ้าเดือนถูกปิดแล้ว
 */
export async function isMonthClosed(
  year: number,
  month: number
): Promise<boolean> {
  const closed = await prisma.monthlyClose.findUnique({
    where: {
      year_month: { year, month },
    },
  });
  return !!closed;
}

/**
 * ปิดเดือน พร้อมสร้าง MonthlySummary snapshot
 */
export async function closeMonth(
  year: number,
  month: number,
  note?: string
): Promise<void> {
  // ตรวจสอบว่ายังไม่ถูกปิด
  const existing = await prisma.monthlyClose.findUnique({
    where: { year_month: { year, month } },
  });

  if (existing) {
    throw new Error(`เดือน ${month}/${year} ถูกปิดไปแล้ว`);
  }

  // สร้าง MonthlyClose record
  await prisma.monthlyClose.create({
    data: {
      year,
      month,
      note,
    },
  });
}

/**
 * Helper: ดึง range วันที่ของเดือน (สำหรับ query)
 */
export function getMonthDateRange(
  year: number,
  month: number
): { startDate: Date; endDate: Date } {
  const startDate = new Date(year, month - 1, 1); // first day of month
  const endDate = new Date(year, month, 0, 23, 59, 59, 999); // last day of month
  return { startDate, endDate };
}
