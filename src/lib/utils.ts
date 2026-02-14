import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format number as Thai Baht currency
 */
export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
  }).format(num);
}

/**
 * Format number with commas
 */
export function formatNumber(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

import { formatDateTH, formatDateShortTH } from "./date-th";

/**
 * Format date to Thai locale (พ.ศ.)
 */
export function formatDate(date: Date | string): string {
  return formatDateTH(date);
}

/**
 * Format date to short format (พ.ศ. เช่น 12/02/2568)
 */
export function formatDateShort(date: Date | string): string {
  return formatDateShortTH(date);
}
