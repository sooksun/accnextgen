# Tasks: ระบบบัญชีมินิมัล (Minimal Accounting)

## Status Legend
- ⏳ Pending - ยังไม่ได้ทำ
- 🔄 In Progress - กำลังทำ
- ✅ Completed - เสร็จแล้ว
- ❌ Cancelled - ยกเลิก

---

## Phase 1: Foundation ✅
- [x] ✅ อัปเดต context.md ตาม PRD ใหม่
- [x] ✅ อัปเดต plan.md ตาม PRD ใหม่
- [x] ✅ อัปเดต tasks.md
- [x] ✅ สร้าง Prisma Schema ใหม่ (Customer, Order, Project, Document, Expense, Payment, WHT, MonthlyClose, MonthlySummary)
- [x] ✅ ตั้งค่า Next.js App Router + Tailwind + shadcn/ui + Zod
- [x] ✅ สร้าง seed.ts ข้อมูลพื้นฐาน
- [x] ✅ สร้าง .env.example

## Phase 2: Core Libraries ✅
- [x] ✅ lib/prisma.ts (Prisma Client singleton)
- [x] ✅ lib/utils.ts (cn, formatCurrency, formatNumber, formatDate)
- [x] ✅ lib/tax.ts (VAT/WHT calculations)
- [x] ✅ lib/docNumber.ts (Document/Order/Project number generator)
- [x] ✅ lib/monthLock.ts (Month lock guard)
- [x] ✅ lib/csv.ts (CSV export utility)

## Phase 3: API Routes ✅
- [x] ✅ CRUD: /api/customers + /api/customers/[id]
- [x] ✅ CRUD: /api/customer-units
- [x] ✅ CRUD: /api/orders + /api/orders/[id]
- [x] ✅ CRUD: /api/projects + /api/projects/[id]
- [x] ✅ CRUD: /api/documents + /api/documents/[id]
- [x] ✅ /api/documents/[id]/pdf (HTML → Print PDF)
- [x] ✅ CRUD: /api/expenses
- [x] ✅ CRUD: /api/payments
- [x] ✅ /api/reports/vat-sales (JSON + CSV)
- [x] ✅ /api/reports/vat-purchase (JSON + CSV)
- [x] ✅ /api/reports/wht (JSON + CSV)
- [x] ✅ /api/reports/wht-detail (JSON + ติดตามใบรับรอง)
- [x] ✅ /api/reports/monthly-summary (Revenue/Expense/VAT/WHT/P&L/P&L by stream)
- [x] ✅ /api/monthly-close (ปิด/เปิดเดือน)

## Phase 4: UI Pages ✅
- [x] ✅ Layout + Sidebar Navigation
- [x] ✅ Dashboard (สรุปรวม + P&L แยก Goods/Service + VAT Summary)
- [x] ✅ Customers page (CRUD + Units + Search)
- [x] ✅ Orders page (CRUD + Items + Status filter)
- [x] ✅ Projects page (CRUD + Milestones)
- [x] ✅ Documents page (List + PDF button + Type filter)
- [x] ✅ Finance page (Expenses + Reports CSV download + Close Month tabs)

## Phase 5: PDF & Reports ✅
- [x] ✅ HTML Templates (Quotation, Invoice, Tax Invoice/Receipt) + base.ts
- [x] ✅ PDF route (/api/documents/[id]/pdf) - HTML mode + ready for Puppeteer
- [x] ✅ render.ts (template selector)
- [x] ✅ CSV export ใน reports (vat-sales, vat-purchase, wht)
- [x] ✅ Monthly Summary API (P&L + P&L by stream Goods/Service)

## Phase 6: Polish
- [ ] ⏳ Responsive testing
- [ ] ⏳ Form validation error messages
- [ ] ⏳ Loading states enhancement
- [ ] ⏳ Puppeteer integration (optional)

---

**Last Updated**: Build สำเร็จ ✅ (Next.js 15.5.12)
**Architecture**: Next.js App Router (single app) + Prisma + MySQL
**Build Status**: ✅ Compiled successfully - all 22 routes working
