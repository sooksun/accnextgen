import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { z } from "zod";

const updateProjectSchema = z.object({
  title: z.string().min(1).optional(),
  unitId: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  milestones: z
    .array(
      z.object({
        id: z.string().optional(),
        title: z.string().min(1),
        amount: z.number().min(0),
        dueDate: z.string().optional().nullable(),
        isBilled: z.boolean().optional(),
      })
    )
    .optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/projects/[id]
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        customer: true,
        unit: true,
        milestones: true,
        documents: { include: { withholdingTax: true } },
        attachments: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลโครงการ" },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("GET /api/projects/[id] error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// PUT /api/projects/[id]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateProjectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { milestones, startDate, endDate, ...projectData } = parsed.data;

    // Handle milestones update
    if (milestones) {
      await prisma.projectMilestone.deleteMany({ where: { projectId: id } });
      await prisma.projectMilestone.createMany({
        data: milestones.map(({ id: _id, ...m }) => ({
          ...m,
          projectId: id,
          dueDate: m.dueDate ? new Date(m.dueDate) : null,
          isBilled: m.isBilled ?? false,
        })),
      });
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...projectData,
        startDate: startDate === null ? null : startDate ? new Date(startDate) : undefined,
        endDate: endDate === null ? null : endDate ? new Date(endDate) : undefined,
      },
      include: {
        customer: { select: { name: true } },
        unit: { select: { name: true } },
        milestones: true,
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("PUT /api/projects/[id] error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// DELETE /api/projects/[id]
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ message: "ลบโครงการสำเร็จ" });
  } catch (error) {
    console.error("DELETE /api/projects/[id] error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
