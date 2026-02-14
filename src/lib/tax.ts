/**
 * Tax Calculation Utilities
 * VAT 7% + WHT (Withholding Tax) calculations
 */

/** Default VAT rate */
export const DEFAULT_VAT_RATE = 7.0;

/** Default WHT rate for services */
export const DEFAULT_WHT_SERVICE_RATE = 3.0;

/**
 * คำนวณ VAT จาก subTotal
 */
export function calculateVat(
  subTotal: number,
  vatRate: number = DEFAULT_VAT_RATE
): number {
  return round2(subTotal * (vatRate / 100));
}

/**
 * คำนวณ grandTotal (subTotal + VAT)
 */
export function calculateGrandTotal(
  subTotal: number,
  vatRate: number = DEFAULT_VAT_RATE
): number {
  const vatAmount = calculateVat(subTotal, vatRate);
  return round2(subTotal + vatAmount);
}

/**
 * คำนวณภาษีหัก ณ ที่จ่าย (WHT)
 */
export function calculateWht(
  baseAmount: number,
  whtRate: number = DEFAULT_WHT_SERVICE_RATE
): number {
  return round2(baseAmount * (whtRate / 100));
}

/**
 * คำนวณเงินรับจริงหลังหัก WHT
 * netReceived = grandTotal - whtAmount
 */
export function calculateNetReceived(
  grandTotal: number,
  whtAmount: number
): number {
  return round2(grandTotal - whtAmount);
}

/**
 * คำนวณ VAT Payable = VAT Output - VAT Input
 */
export function calculateVatPayable(
  vatOutput: number,
  vatInput: number
): number {
  return round2(vatOutput - vatInput);
}

/**
 * คำนวณ lineTotal สำหรับ OrderItem
 */
export function calculateLineTotal(qty: number, unitPrice: number): number {
  return round2(qty * unitPrice);
}

/**
 * ปัดเศษ 2 ตำแหน่ง
 */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Full tax breakdown calculation
 */
export function calculateTaxBreakdown(
  subTotal: number,
  vatRate: number = DEFAULT_VAT_RATE,
  whtRate?: number,
  whtBase?: number
) {
  const vatAmount = calculateVat(subTotal, vatRate);
  const grandTotal = round2(subTotal + vatAmount);

  let whtAmount = 0;
  let netReceived = grandTotal;

  if (whtRate && whtBase) {
    whtAmount = calculateWht(whtBase, whtRate);
    netReceived = calculateNetReceived(grandTotal, whtAmount);
  }

  return {
    subTotal: round2(subTotal),
    vatRate,
    vatAmount,
    grandTotal,
    whtRate: whtRate ?? 0,
    whtBase: whtBase ?? 0,
    whtAmount,
    netReceived,
  };
}
