import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { generateProjectCode } from "@/src/lib/docNumber";
import { z } from "zod";

const milestoneSchema = z.object({
  title: z.string().min(1),
  amount: z.number().min(0),
  dueDate: z.string().optional(),
});

const createProjectSchema = z.object({
  customerId: z.string().min(1, "กรุณาเลือกลูกค้า"),
  unitId: z.string().optional(),
  title: z.string().min(1, "กรุณากรอกชื่อโครงการ"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  milestones: z.array(milestoneSchema).optional(),
});

// GET /api/projects
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");
    const search = searchParams.get("search") ?? "";
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (customerId) where.customerId = customerId;
    if (search) {
      where.OR = [
        { code: { contains: search } },
        { title: { contains: search } },
        { customer: { name: { contains: search } } },
      ];
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          customer: { select: { name: true } },
          unit: { select: { name: true } },
          milestones: true,
          _count: { select: { documents: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.project.count({ where }),
    ]);

    return NextResponse.json({
      data: projects,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// POST /api/projects
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createProjectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { milestones, startDate, endDate, ...projectData } = parsed.data;
    const code = await generateProjectCode();

    const project = await prisma.project.create({
      data: {
        code,
        ...projectData,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        milestones: milestones
          ? {
              create: milestones.map((m) => ({
                ...m,
                dueDate: m.dueDate ? new Date(m.dueDate) : undefined,
              })),
            }
          : undefined,
      },
      include: {
        customer: { select: { name: true } },
        unit: { select: { name: true } },
        milestones: true,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("POST /api/projects error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
