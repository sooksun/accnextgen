"use client";

/**
 * DatePicker ภาษาไทย (พ.ศ.)
 * อ้างอิง: https://9mza.net/post/antd-date-thai-locale-nextjs
 */
import React from "react";
import th from "antd/es/date-picker/locale/th_TH";
import dayjs from "dayjs";
import buddhistEra from "dayjs/plugin/buddhistEra";
import "dayjs/locale/th";
import { DatePicker, DatePickerProps } from "antd";

dayjs.extend(buddhistEra);
dayjs.locale("th");

const buddhistLocale: typeof th = {
  ...th,
  lang: {
    ...th.lang,
    fieldDateFormat: "BBBB-MM-DD",
    fieldDateTimeFormat: "BBBB-MM-DD HH:mm:ss",
    yearFormat: "BBBB",
    cellYearFormat: "BBBB",
  } as typeof th.lang,
};

export interface ThaiDatePickerProps extends Omit<DatePickerProps, "locale" | "value" | "onChange"> {
  /** ค่าเป็น string YYYY-MM-DD (คริสต์ศักราช) */
  value?: string | null;
  onChange?: (isoDate: string | null) => void;
}

export function ThaiDatePicker({ value, onChange, ...rest }: ThaiDatePickerProps) {
  const dayjsValue = value ? dayjs(value) : null;

  const handleChange: DatePickerProps["onChange"] = (date, _dateStr) => {
    if (onChange) {
      const d = Array.isArray(date) ? date[0] : date;
      onChange(d ? d.format("YYYY-MM-DD") : null);
    }
  };

  return (
    <DatePicker
      locale={buddhistLocale}
      value={dayjsValue}
      onChange={handleChange}
      format="DD/MM/BBBB"
      placeholder="เลือกวันที่"
      className="w-full"
      {...rest}
    />
  );
}

export default ThaiDatePicker;
