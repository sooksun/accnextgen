/**
 * วันที่ภาษาไทย (พ.ศ.) — ใช้ dayjs + Buddhist Era
 * อ้างอิง: https://9mza.net/post/antd-date-thai-locale-nextjs
 */
import dayjs from "dayjs";
import buddhistEra from "dayjs/plugin/buddhistEra";
import "dayjs/locale/th";

dayjs.extend(buddhistEra);
dayjs.locale("th");

/** ค่า dayjs ที่ตั้ง locale เป็นไทยและรองรับ พ.ศ. แล้ว */
export const dayjsTH = dayjs;

/**
 * แปลง Date หรือ ISO string เป็นข้อความวันที่ พ.ศ. (แบบเต็ม)
 * เช่น "12 กุมภาพันธ์ 2568"
 */
export function formatDateTH(date: Date | string): string {
  const d = typeof date === "string" ? dayjs(date) : dayjs(date);
  return d.format("D MMMM BBBB");
}

/**
 * แปลงเป็นวันที่สั้น พ.ศ. เช่น 12/02/2568
 */
export function formatDateShortTH(date: Date | string): string {
  const d = typeof date === "string" ? dayjs(date) : dayjs(date);
  return d.format("DD/MM/BBBB");
}

/**
 * แปลงเป็นปี พ.ศ. (จำนวนเต็ม)
 */
export function getYearTH(date: Date | string): number {
  const d = typeof date === "string" ? dayjs(date) : dayjs(date);
  return d.year(); // dayjs ใน locale th + buddhistEra ให้ year เป็น พ.ศ. แล้ว
}

/**
 * รับค่า YYYY-MM-DD จาก input แล้วแปลงเป็น dayjs (พ.ศ. ถ้าใช้กับ DatePicker)
 * คืนค่า ISO string YYYY-MM-DD สำหรับส่ง API
 */
export function parseInputDate(value: string): string {
  if (!value) return "";
  return dayjs(value).format("YYYY-MM-DD");
}
