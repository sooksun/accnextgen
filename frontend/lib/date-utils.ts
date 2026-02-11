import dayjs, { Dayjs } from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'

// ตั้งค่า dayjs สำหรับ พ.ศ.
dayjs.extend(buddhistEra)
dayjs.locale('th')

/**
 * แปลงวันที่ ค.ศ. เป็น พ.ศ.
 * @param dateString วันที่ในรูปแบบ YYYY-MM-DD หรือ Date object
 * @returns วันที่ในรูปแบบ พ.ศ. (dayjs object)
 */
export function toBuddhistEra(dateString: string | Date): Dayjs {
  // dayjs ใช้ buddhistEra plugin แล้ว ตัวมันจะแปลงอัตโนมัติเมื่อใช้ format BBBB
  return dayjs(dateString).locale('th')
}

/**
 * แปลงวันที่ พ.ศ. เป็น ค.ศ. (สำหรับส่งไป API)
 * @param buddhistDate วันที่ในรูปแบบ พ.ศ. (dayjs object)
 * @returns วันที่ในรูปแบบ YYYY-MM-DD (ค.ศ.)
 */
export function toCommonEra(buddhistDate: Dayjs | null): string {
  if (!buddhistDate) return ''
  return buddhistDate.format('YYYY-MM-DD')
}

/**
 * แสดงวันที่เป็น พ.ศ.
 * @param dateString วันที่ในรูปแบบ YYYY-MM-DD หรือ Date object
 * @param format รูปแบบการแสดงผล (default: 'DD MMM BBBB')
 * @returns วันที่ในรูปแบบ พ.ศ.
 */
export function formatThaiDate(
  dateString: string | Date,
  format: string = 'DD MMM BBBB'
): string {
  const d = dayjs(dateString)
  // ใช้ BBBB เพื่อแสดงปี พ.ศ.
  return d.locale('th').format(format)
}

/**
 * แปลงวันที่จาก API (ค.ศ.) เป็น dayjs object (พ.ศ.)
 * @param dateString วันที่ในรูปแบบ YYYY-MM-DD
 * @returns dayjs object
 */
export function parseApiDate(dateString: string): Dayjs {
  return dayjs(dateString).locale('th')
}

