import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { renderDocument } from "@/src/docTemplates/render";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/documents/[id]/pdf
 * สร้าง PDF จาก Document โดยใช้ HTML template
 *
 * NOTE: Puppeteer ต้อง install เพิ่ม (`npm install puppeteer`)
 * ถ้าไม่มี Puppeteer จะ return HTML แทน
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // ดึงข้อมูลเอกสาร
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        customer: true,
        order: { include: { items: true } },
        project: { include: { milestones: true } },
        withholdingTax: true,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "ไม่พบเอกสาร" },
        { status: 404 }
      );
    }

    // ดึงข้อมูลบริษัท จาก Settings
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            "COMPANY_NAME",
            "COMPANY_TAXID",
            "COMPANY_ADDRESS",
            "COMPANY_BRANCH",
          ],
        },
      },
    });

    const settingMap = Object.fromEntries(
      settings.map((s) => [s.key, s.value])
    );

    const company = {
      name: settingMap.COMPANY_NAME ?? "บริษัท",
      taxId: settingMap.COMPANY_TAXID ?? "",
      address: settingMap.COMPANY_ADDRESS ?? "",
      branch: settingMap.COMPANY_BRANCH ?? "00000",
    };

    // เตรียม items จาก order หรือ project milestones
    let items: {
      name: string;
      qty: number;
      unitPrice: number | string;
      lineTotal: number | string;
    }[] = [];

    if (document.order?.items) {
      items = document.order.items.map((item) => ({
        name: item.name,
        qty: item.qty,
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.lineTotal),
      }));
    } else if (document.project?.milestones) {
      items = document.project.milestones
        .filter((m) => m.isBilled)
        .map((m) => ({
          name: m.title,
          qty: 1,
          unitPrice: Number(m.amount),
          lineTotal: Number(m.amount),
        }));
    }

    // ถ้าไม่มี items ให้ใส่รายการทั่วไป
    if (items.length === 0) {
      items = [
        {
          name: "ตามเอกสารแนบ",
          qty: 1,
          unitPrice: Number(document.subTotal),
          lineTotal: Number(document.subTotal),
        },
      ];
    }

    // Render HTML
    const html = renderDocument({
      type: document.type,
      number: document.number,
      issueDate: document.issueDate,
      customer: {
        name: document.customer.name,
        taxId: document.customer.taxId,
        address: document.customer.address,
      },
      items,
      subTotal: Number(document.subTotal),
      vatRate: Number(document.vatRate),
      vatAmount: Number(document.vatAmount),
      grandTotal: Number(document.grandTotal),
      note: document.note,
      wht: document.withholdingTax
        ? {
            rate: Number(document.withholdingTax.rate),
            baseAmount: Number(document.withholdingTax.baseAmount),
            taxAmount: Number(document.withholdingTax.taxAmount),
          }
        : null,
      company,
    });

    // Return HTML for print (Puppeteer optional)
    // ถ้าต้องการ PDF จริง ให้ install puppeteer แล้ว uncomment ด้านล่าง
    // ตอนนี้ return HTML ให้ใช้ browser print to PDF แทน
    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("GET /api/documents/[id]/pdf error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
