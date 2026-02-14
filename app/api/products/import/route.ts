import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { z } from "zod";

/**
 * Bulk Import Schema
 * Maps to Python scraper fields:
 *   goods_id       → sku
 *   goods_name     → name
 *   price_per_piece → unitPrice
 *   discount       → discount
 *   images_url     → imageUrl
 *   get_web_url    → sourceUrl
 *   record_dateTime → scrapedAt
 */
const importItemSchema = z.object({
  sku: z.string().optional().nullable(),             // goods_id
  name: z.string().min(1, "ชื่อสินค้าจำเป็น"),       // goods_name
  description: z.string().optional().nullable(),
  category: z.enum(["GOODS", "SERVICE"]).default("GOODS"),
  groupId: z.string().optional().nullable(),         // product group id
  groupName: z.string().optional().nullable(),       // auto-find/create group
  unit: z.string().min(1).default("ชิ้น"),
  unitPrice: z.number().min(0),                      // price_per_piece
  discount: z.number().min(0).optional().nullable(),  // discount
  imageUrl: z.string().optional().nullable(),         // images_url
  sourceUrl: z.string().optional().nullable(),        // get_web_url
  scrapedAt: z.string().optional().nullable(),        // record_dateTime
  isActive: z.boolean().default(true),
});

const bulkImportSchema = z.object({
  products: z.array(importItemSchema).min(1, "ต้องมีสินค้าอย่างน้อย 1 รายการ"),
  skipDuplicates: z.boolean().default(true),
  matchBy: z.enum(["sku", "name"]).default("name"),
});

// POST /api/products/import  — Bulk import from Python scraper
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = bulkImportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { products, skipDuplicates, matchBy } = parsed.data;

    const results = {
      imported: 0,
      skipped: 0,
      updated: 0,
      errors: [] as { index: number; name: string; error: string }[],
    };

    // Cache group lookups for performance
    const groupCache = new Map<string, string>();

    for (let i = 0; i < products.length; i++) {
      const { scrapedAt, groupName, ...productData } = products[i];

      try {
        // Check for existing product
        let existing = null;
        if (matchBy === "sku" && productData.sku) {
          existing = await prisma.product.findUnique({ where: { sku: productData.sku } });
        } else if (matchBy === "name") {
          existing = await prisma.product.findFirst({ where: { name: productData.name } });
        }

        // Resolve groupName → groupId if provided
        let resolvedGroupId = productData.groupId;
        if (!resolvedGroupId && groupName) {
          const trimmed = groupName.trim();
          if (groupCache.has(trimmed)) {
            resolvedGroupId = groupCache.get(trimmed)!;
          } else {
            let grp = await prisma.productGroup.findFirst({ where: { name: trimmed } });
            if (!grp) {
              grp = await prisma.productGroup.create({ data: { name: trimmed } });
            }
            groupCache.set(trimmed, grp.id);
            resolvedGroupId = grp.id;
          }
        }

        const data = {
          ...productData,
          groupId: resolvedGroupId || null,
          scrapedAt: scrapedAt ? new Date(scrapedAt) : new Date(),
        };

        if (existing) {
          if (skipDuplicates) {
            results.skipped++;
            continue;
          } else {
            // Update existing — refresh price, discount, image, etc.
            await prisma.product.update({
              where: { id: existing.id },
              data,
            });
            results.updated++;
            continue;
          }
        }

        // Create new product
        await prisma.product.create({ data });
        results.imported++;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        results.errors.push({ index: i, name: productData.name, error: message });
      }
    }

    return NextResponse.json({
      message: `นำเข้าสำเร็จ ${results.imported} รายการ`,
      ...results,
      total: products.length,
    });
  } catch (error) {
    console.error("POST /api/products/import error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
