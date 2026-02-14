import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getMonthDateRange } from "@/src/lib/monthLock";
import { Prisma } from "@prisma/client";

/**
 * GET /api/reports/monthly-summary?year=2026&month=2
 *
 * คำนวณสรุปรายเดือน:
 * - Revenue จาก TAX_INVOICE_RECEIPT
 * - Expenses
 * - VAT (Output/Input/Payable)
 * - WHT
 * - P&L (รวม + แยก Goods/Service)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));
    const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));

    const { startDate, endDate } = getMonthDateRange(year, month);

    // 1. Revenue: จาก TAX_INVOICE_RECEIPT
    const revenueResult = await prisma.document.aggregate({
      where: {
        type: "TAX_INVOICE_RECEIPT",
        issueDate: { gte: startDate, lte: endDate },
      },
      _sum: {
        subTotal: true,
        vatAmount: true,
        grandTotal: true,
      },
    });

    // 2. Expenses
    const expenseResult = await prisma.expense.aggregate({
      where: {
        expenseDate: { gte: startDate, lte: endDate },
      },
      _sum: {
        subTotal: true,
        vatAmount: true,
        grandTotal: true,
      },
    });

    // VAT Input (เฉพาะ hasVat=true)
    const vatInputResult = await prisma.expense.aggregate({
      where: {
        expenseDate: { gte: startDate, lte: endDate },
        hasVat: true,
      },
      _sum: {
        vatAmount: true,
      },
    });

    // 3. WHT
    const whtResult = await prisma.withholdingTax.aggregate({
      where: {
        document: {
          issueDate: { gte: startDate, lte: endDate },
        },
      },
      _sum: {
        baseAmount: true,
        taxAmount: true,
      },
      _count: true,
    });

    // 4. P&L calculations
    const revenueSubTotal = Number(revenueResult._sum.subTotal ?? 0);

    // COGS: INVENTORY_PURCHASE + SHIPPING_OUT
    const cogsResult = await prisma.expense.aggregate({
      where: {
        expenseDate: { gte: startDate, lte: endDate },
        category: { in: ["INVENTORY_PURCHASE", "SHIPPING_OUT"] },
      },
      _sum: { subTotal: true },
    });

    // OPEX: ทุกหมวดยกเว้น COGS
    const opexResult = await prisma.expense.aggregate({
      where: {
        expenseDate: { gte: startDate, lte: endDate },
        category: {
          notIn: ["INVENTORY_PURCHASE", "SHIPPING_OUT"],
        },
      },
      _sum: { subTotal: true },
    });

    const cogs = Number(cogsResult._sum.subTotal ?? 0);
    const opex = Number(opexResult._sum.subTotal ?? 0);
    const grossProfit = revenueSubTotal - cogs;
    const operatingProfit = grossProfit - opex;

    // 5. P&L By Stream (Goods vs Service)
    const goodsRevenueResult = await prisma.document.aggregate({
      where: {
        type: "TAX_INVOICE_RECEIPT",
        issueDate: { gte: startDate, lte: endDate },
        orderId: { not: null },
      },
      _sum: { subTotal: true },
    });

    const serviceRevenueResult = await prisma.document.aggregate({
      where: {
        type: "TAX_INVOICE_RECEIPT",
        issueDate: { gte: startDate, lte: endDate },
        projectId: { not: null },
      },
      _sum: { subTotal: true },
    });

    const goodsRevenue = Number(goodsRevenueResult._sum.subTotal ?? 0);
    const serviceRevenue = Number(serviceRevenueResult._sum.subTotal ?? 0);

    // Goods COGS
    const goodsCogsResult = await prisma.expense.aggregate({
      where: {
        expenseDate: { gte: startDate, lte: endDate },
        category: { in: ["INVENTORY_PURCHASE", "SHIPPING_OUT"] },
        relatedOrderId: { not: null },
      },
      _sum: { subTotal: true },
    });

    // Goods direct OPEX
    const goodsOpexResult = await prisma.expense.aggregate({
      where: {
        expenseDate: { gte: startDate, lte: endDate },
        category: { notIn: ["INVENTORY_PURCHASE", "SHIPPING_OUT"] },
        relatedOrderId: { not: null },
      },
      _sum: { subTotal: true },
    });

    // Service direct cost
    const serviceDirectCostResult = await prisma.expense.aggregate({
      where: {
        expenseDate: { gte: startDate, lte: endDate },
        relatedProjectId: { not: null },
      },
      _sum: { subTotal: true },
    });

    // Shared OPEX (ไม่ผูกทั้ง order/project)
    const sharedOpexResult = await prisma.expense.aggregate({
      where: {
        expenseDate: { gte: startDate, lte: endDate },
        relatedOrderId: null,
        relatedProjectId: null,
      },
      _sum: { subTotal: true },
    });

    const goodsCogs = Number(goodsCogsResult._sum.subTotal ?? 0);
    const goodsDirectOpex = Number(goodsOpexResult._sum.subTotal ?? 0);
    const serviceDirectCost = Number(serviceDirectCostResult._sum.subTotal ?? 0);
    const sharedOpex = Number(sharedOpexResult._sum.subTotal ?? 0);

    // Allocate shared OPEX by revenue ratio
    const totalRevenue = goodsRevenue + serviceRevenue;
    let goodsShare = 0;
    let serviceShare = 0;

    if (totalRevenue > 0) {
      goodsShare = goodsRevenue / totalRevenue;
      serviceShare = 1 - goodsShare;
    } else if (goodsRevenue > 0) {
      goodsShare = 1;
    } else if (serviceRevenue > 0) {
      serviceShare = 1;
    }

    const goodsAllocatedOpex = round2(sharedOpex * goodsShare);
    const serviceAllocatedOpex = round2(sharedOpex * serviceShare);

    const goodsOperatingProfit =
      goodsRevenue - goodsCogs - goodsDirectOpex;
    const goodsNetOperating = goodsOperatingProfit - goodsAllocatedOpex;

    const serviceOperatingProfit = serviceRevenue - serviceDirectCost;
    const serviceNetOperating = serviceOperatingProfit - serviceAllocatedOpex;

    const vatOutput = Number(revenueResult._sum.vatAmount ?? 0);
    const vatInput = Number(vatInputResult._sum.vatAmount ?? 0);

    return NextResponse.json({
      period: { year, month },
      revenue: {
        subTotal: revenueSubTotal,
        vat: vatOutput,
        grandTotal: Number(revenueResult._sum.grandTotal ?? 0),
      },
      expenses: {
        subTotal: Number(expenseResult._sum.subTotal ?? 0),
        vat: Number(expenseResult._sum.vatAmount ?? 0),
        grandTotal: Number(expenseResult._sum.grandTotal ?? 0),
      },
      vat: {
        output: vatOutput,
        input: vatInput,
        payable: round2(vatOutput - vatInput),
      },
      wht: {
        baseAmount: Number(whtResult._sum.baseAmount ?? 0),
        taxAmount: Number(whtResult._sum.taxAmount ?? 0),
        count: whtResult._count,
      },
      pnl: {
        revenue: revenueSubTotal,
        cogs,
        grossProfit,
        opex,
        operatingProfit,
      },
      pnlByStream: {
        goods: {
          revenue: goodsRevenue,
          cogs: goodsCogs,
          directOpex: goodsDirectOpex,
          allocatedSharedOpex: goodsAllocatedOpex,
          netOperatingProfit: round2(goodsNetOperating),
        },
        service: {
          revenue: serviceRevenue,
          directCost: serviceDirectCost,
          allocatedSharedOpex: serviceAllocatedOpex,
          netOperatingProfit: round2(serviceNetOperating),
        },
        sharedOpex,
        allocationMethod: "REVENUE_RATIO",
      },
    });
  } catch (error) {
    console.error("GET /api/reports/monthly-summary error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
