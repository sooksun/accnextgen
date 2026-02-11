import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

/**
 * POST /api/products/fetch-external
 * Trigger product fetching from external sources.
 *
 * Body:
 *   method: "scrape" | "api"           — Feature 1 (scraping) or Feature 2 (official API)
 *   source: string                      — e.g. "shopee", "lazada", "jib", "demo-shopee"
 *   keyword?: string                    — search keyword
 *   limit?: number                      — max products
 *   dryRun?: boolean                    — preview only
 *   updateExisting?: boolean            — update or skip duplicates
 *   matchBy?: "name" | "sku"
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      method = "scrape",
      source = "demo",
      keyword = "",
      limit = 50,
      dryRun = false,
      updateExisting = false,
      matchBy = "name",
    } = body;

    const scriptsDir = path.join(process.cwd(), "scripts");

    let cmd: string;

    if (method === "api") {
      // Feature 2: Official API
      const args = [
        `--source ${source}`,
        keyword ? `--keyword "${keyword}"` : "",
        `--limit ${limit}`,
        `--match-by ${matchBy}`,
        updateExisting ? "--update-existing" : "",
        dryRun ? "--dry-run" : "",
        "--output-json fetch_result.json",
      ].filter(Boolean).join(" ");

      cmd = `python api_products.py ${args}`;
    } else {
      // Feature 1: Web Scraping
      const isDemoMode = source.startsWith("demo") || !source.includes("http");
      let args: string;

      if (isDemoMode) {
        const siteName = source.replace("demo-", "").replace("demo", "default");
        args = [
          `--mode demo`,
          `--site ${siteName}`,
          `--match-by ${matchBy}`,
          updateExisting ? "--update-existing" : "",
          dryRun ? "--dry-run" : "",
          "--output-json fetch_result.json",
        ].filter(Boolean).join(" ");
      } else {
        args = [
          `--mode url`,
          `--url "${source}"`,
          keyword ? `--keyword "${keyword}"` : "",
          `--max-pages 3`,
          `--match-by ${matchBy}`,
          updateExisting ? "--update-existing" : "",
          dryRun ? "--dry-run" : "",
          "--output-json fetch_result.json",
        ].filter(Boolean).join(" ");
      }

      cmd = `python scrape_products.py ${args}`;
    }

    const { stdout, stderr } = await execAsync(cmd, {
      cwd: scriptsDir,
      timeout: 120000,
      env: { ...process.env, PYTHONIOENCODING: "utf-8" },
    });

    // Parse result JSON if available
    let products = [];
    try {
      const fs = await import("fs");
      const resultPath = path.join(scriptsDir, "fetch_result.json");
      if (fs.existsSync(resultPath)) {
        const raw = fs.readFileSync(resultPath, "utf-8");
        products = JSON.parse(raw);
        fs.unlinkSync(resultPath); // cleanup
      }
    } catch {
      // JSON output not available, that's ok
    }

    // Extract stats from log
    const importedMatch = stdout.match(/Imported\s*:\s*(\d+)/);
    const skippedMatch = stdout.match(/Skipped\s*:\s*(\d+)/);
    const updatedMatch = stdout.match(/Updated\s*:\s*(\d+)/);
    const totalMatch = stdout.match(/Total products (?:scraped|fetched)[^:]*:\s*(\d+)/);

    return NextResponse.json({
      success: true,
      method,
      source,
      stats: {
        total: totalMatch ? parseInt(totalMatch[1]) : products.length,
        imported: importedMatch ? parseInt(importedMatch[1]) : 0,
        skipped: skippedMatch ? parseInt(skippedMatch[1]) : 0,
        updated: updatedMatch ? parseInt(updatedMatch[1]) : 0,
      },
      products: dryRun ? products : [],
      log: (stdout + (stderr || "")).slice(-2000),
    });
  } catch (error: unknown) {
    const errObj = error as { stdout?: string; stderr?: string; message?: string };
    console.error("fetch-external error:", errObj.message || error);
    return NextResponse.json(
      {
        success: false,
        error: errObj.stderr?.slice(-500) || errObj.message || "เกิดข้อผิดพลาด",
        log: (errObj.stdout || "").slice(-1000),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/products/fetch-external
 * Get configuration status of all providers.
 */
export async function GET() {
  // Return which providers have keys configured
  const providers = {
    lnwshop: {
      name: "LnwShop Open API",
      docs: "https://docs.open.lnwshop.com/",
      configured: !!(process.env.LNWSHOP_API_KEY && process.env.LNWSHOP_SHOP_NAME),
      features: ["products", "categories", "orders"],
    },
    shopee: {
      name: "Shopee Open Platform",
      docs: "https://open.shopee.com/",
      configured: !!(process.env.SHOPEE_PARTNER_ID && process.env.SHOPEE_PARTNER_KEY && process.env.SHOPEE_ACCESS_TOKEN),
      features: ["products", "orders", "shop_info"],
    },
    lazada: {
      name: "Lazada Open Platform",
      docs: "https://open.lazada.com/",
      configured: !!(process.env.LAZADA_APP_KEY && process.env.LAZADA_APP_SECRET && process.env.LAZADA_ACCESS_TOKEN),
      features: ["products", "orders", "categories"],
    },
    bigc: {
      name: "BigC OSX API",
      docs: "https://bgcd-osxapi.bigc.co.th/",
      configured: !!(process.env.BIGC_API_KEY),
      features: ["products", "categories"],
    },
  };

  return NextResponse.json({ providers });
}
