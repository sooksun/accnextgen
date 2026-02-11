import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { assertNotClosed, MonthClosedError } from "@/src/lib/monthLock";
import { z } from "zod";

const updateDocSchema = z.object({
  subTotal: z.number().min(0).optional(),
  vatRate: z.number().min(0).optional(),
  vatAmount: z.number().min(0).optional(),
  grandTotal: z.number().min(0).optional(),
  note: z.string().optional().nullable(),
  wht: z
    .object({
      rate: z.number().min(0),
      baseAmount: z.number().min(0),
      taxAmount: z.number().min(0),
      certificateNo: z.string().optional().nullable(),
      certificateDate: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
});

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/documents/[id]
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        customer: true,
        items: { include: { product: { select: { sku: true, category: true } } } },
        order: { include: { items: true } },
        project: { include: { milestones: true } },
        withholdingTax: true,
        payments: true,
        attachments: true,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลเอกสาร" },
        { status: 404 }
      );
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error("GET /api/documents/[id] error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// PUT /api/documents/[id]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateDocSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Check month lock
    const existing = await prisma.document.findUnique({
      where: { id },
      select: { issueDate: true },
    });
    if (existing) {
      try {
        await assertNotClosed(existing.issueDate);
      } catch (e) {
        if (e instanceof MonthClosedError) {
          return NextResponse.json({ error: e.message }, { status: 403 });
        }
        throw e;
      }
    }

    const { wht, ...docData } = parsed.data;

    // Handle WHT update
    if (wht !== undefined) {
      if (wht === null) {
        await prisma.withholdingTax.deleteMany({ where: { documentId: id } });
      } else {
        await prisma.withholdingTax.upsert({
          where: { documentId: id },
          create: {
            documentId: id,
            ...wht,
            certificateDate: wht.certificateDate
              ? new Date(wht.certificateDate)
              : null,
          },
          update: {
            ...wht,
            certificateDate: wht.certificateDate
              ? new Date(wht.certificateDate)
              : null,
          },
        });
      }
    }

    const document = await prisma.document.update({
      where: { id },
      data: docData,
      include: {
        customer: { select: { name: true } },
        withholdingTax: true,
      },
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error("PUT /api/documents/[id] error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// DELETE /api/documents/[id]
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check month lock
    const existing = await prisma.document.findUnique({
      where: { id },
      select: { issueDate: true },
    });
    if (existing) {
      try {
        await assertNotClosed(existing.issueDate);
      } catch (e) {
        if (e instanceof MonthClosedError) {
          return NextResponse.json({ error: e.message }, { status: 403 });
        }
        throw e;
      }
    }

    await prisma.document.delete({ where: { id } });
    return NextResponse.json({ message: "ลบเอกสารสำเร็จ" });
  } catch (error) {
    console.error("DELETE /api/documents/[id] error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
