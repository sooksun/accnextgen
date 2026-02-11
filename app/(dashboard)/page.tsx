"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/src/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  ShoppingCart,
  FolderKanban,
  Users,
  AlertCircle,
} from "lucide-react";

interface MonthlySummary {
  period: { year: number; month: number };
  revenue: { subTotal: number; vat: number; grandTotal: number };
  expenses: { subTotal: number; vat: number; grandTotal: number };
  vat: { output: number; input: number; payable: number };
  wht: { baseAmount: number; taxAmount: number; count: number };
  pnl: {
    revenue: number;
    cogs: number;
    grossProfit: number;
    opex: number;
    operatingProfit: number;
  };
  pnlByStream: {
    goods: { revenue: number; netOperatingProfit: number };
    service: { revenue: number; netOperatingProfit: number };
    sharedOpex: number;
  };
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().getMonth() + 1
  );

  useEffect(() => {
    fetchSummary();
  }, [selectedYear, selectedMonth]);

  async function fetchSummary() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/reports/monthly-summary?year=${selectedYear}&month=${selectedMonth}`
      );
      if (res.ok) {
        setSummary(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch summary:", err);
    } finally {
      setLoading(false);
    }
  }

  const months = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">แดชบอร์ด</h1>
          <p className="text-slate-500 mt-1">
            สรุปภาพรวมการเงินประจำเดือน
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="border rounded-md px-3 py-2 text-sm bg-white"
          >
            {months.map((m, i) => (
              <option key={i} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="border rounded-md px-3 py-2 text-sm bg-white"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">
                  รายรับ (ไม่รวม VAT)
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatNumber(summary?.revenue.subTotal ?? 0)}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  รวม VAT: {formatNumber(summary?.revenue.grandTotal ?? 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">
                  รายจ่าย (ไม่รวม VAT)
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatNumber(summary?.expenses.subTotal ?? 0)}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  รวม VAT: {formatNumber(summary?.expenses.grandTotal ?? 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">
                  กำไรจากการดำเนินงาน
                </CardTitle>
                <DollarSign className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${(summary?.pnl.operatingProfit ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {formatNumber(summary?.pnl.operatingProfit ?? 0)}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Gross Profit: {formatNumber(summary?.pnl.grossProfit ?? 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">
                  VAT ต้องชำระ
                </CardTitle>
                <FileText className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatNumber(summary?.vat.payable ?? 0)}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  WHT ถูกหัก: {formatNumber(summary?.wht.taxAmount ?? 0)} (
                  {summary?.wht.count ?? 0} รายการ)
                </p>
              </CardContent>
            </Card>
          </div>

          {/* P&L By Stream */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-blue-500" />
                  ขายสินค้า (Goods)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">รายรับ</span>
                    <span className="font-semibold">
                      {formatNumber(
                        summary?.pnlByStream.goods.revenue ?? 0
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-slate-500">กำไรสุทธิ</span>
                    <span
                      className={`font-bold ${(summary?.pnlByStream.goods.netOperatingProfit ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {formatNumber(
                        summary?.pnlByStream.goods.netOperatingProfit ?? 0
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FolderKanban className="h-5 w-5 text-purple-500" />
                  งานบริการ (Service)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">รายรับ</span>
                    <span className="font-semibold">
                      {formatNumber(
                        summary?.pnlByStream.service.revenue ?? 0
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-slate-500">กำไรสุทธิ</span>
                    <span
                      className={`font-bold ${(summary?.pnlByStream.service.netOperatingProfit ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {formatNumber(
                        summary?.pnlByStream.service.netOperatingProfit ?? 0
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* VAT Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">สรุป VAT</CardTitle>
              <CardDescription>
                ประจำเดือน {months[selectedMonth - 1]} {selectedYear}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-slate-500">ภาษีขาย (Output)</p>
                  <p className="text-xl font-bold text-green-600 mt-1">
                    {formatNumber(summary?.vat.output ?? 0)}
                  </p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-slate-500">ภาษีซื้อ (Input)</p>
                  <p className="text-xl font-bold text-red-600 mt-1">
                    {formatNumber(summary?.vat.input ?? 0)}
                  </p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-slate-500">ต้องชำระ (Payable)</p>
                  <p className="text-xl font-bold text-orange-600 mt-1">
                    {formatNumber(summary?.vat.payable ?? 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
