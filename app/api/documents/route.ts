import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { generateDocNumber } from "@/src/lib/docNumber";
import { assertNotClosed, MonthClosedError } from "@/src/lib/monthLock";
import { z } from "zod";

const docItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  unit: z.string().default("ชิ้น"),
  qty: z.number().int().min(1).default(1),
  unitPrice: z.number().min(0),
  productId: z.string().optional(),
});

const createDocSchema = z.object({
  type: z.enum(["QUOTATION", "INVOICE", "TAX_INVOICE_RECEIPT"]),
  customerId: z.string().min(1, "กรุณาเลือกลูกค้า"),
  orderId: z.string().optional(),
  projectId: z.string().optional(),
  issueDate: z.string().optional(),
  subTotal: z.number().min(0),
  vatRate: z.number().min(0).default(7),
  vatAmount: z.number().min(0),
  grandTotal: z.number().min(0),
  note: z.string().optional(),
  // Line items (optional - auto-calculate subTotal if provided)
  items: z.array(docItemSchema).optional(),
  // WHT (optional)
  wht: z
    .object({
      rate: z.number().min(0),
      baseAmount: z.number().min(0),
      taxAmount: z.number().min(0),
      certificateNo: z.string().optional(),
      certificateDate: z.string().optional(),
    })
    .optional(),
});

// GET /api/documents
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const customerId = searchParams.get("customerId");
    const search = searchParams.get("search") ?? "";
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (customerId) where.customerId = customerId;
    if (search) {
      where.OR = [
        { number: { contains: search } },
        { customer: { name: { contains: search } } },
      ];
    }
    if (from || to) {
      where.issueDate = {};
      if (from) (where.issueDate as Record<string, unknown>).gte = new Date(from);
      if (to) (where.issueDate as Record<string, unknown>).lte = new Date(to);
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          customer: { select: { name: true, taxId: true } },
          order: { select: { code: true } },
          project: { select: { code: true, title: true } },
          withholdingTax: true,
          _count: { select: { payments: true, attachments: true } },
        },
        orderBy: { issueDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.document.count({ where }),
    ]);

    return NextResponse.json({
      data: documents,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/documents error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// POST /api/documents
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createDocSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { wht, issueDate, items, ...docData } = parsed.data;
    const date = issueDate ? new Date(issueDate) : new Date();

    // Month lock guard
    try {
      await assertNotClosed(date);
    } catch (e) {
      if (e instanceof MonthClosedError) {
        return NextResponse.json({ error: e.message }, { status: 403 });
      }
      throw e;
    }

    // Process items: calculate lineTotal
    const processedItems = items?.map((item) => ({
      ...item,
      lineTotal: Math.round(item.qty * item.unitPrice * 100) / 100,
    }));

    // Generate document number
    const number = await generateDocNumber(docData.type, date);

    const document = await prisma.document.create({
      data: {
        ...docData,
        number,
        issueDate: date,
        items: processedItems && processedItems.length > 0
          ? { create: processedItems }
          : undefined,
        withholdingTax: wht
          ? {
              create: {
                ...wht,
                certificateDate: wht.certificateDate
                  ? new Date(wht.certificateDate)
                  : undefined,
              },
            }
          : undefined,
      },
      include: {
        customer: { select: { name: true } },
        items: true,
        withholdingTax: true,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("POST /api/documents error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
