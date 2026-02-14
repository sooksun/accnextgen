# แผนการพัฒนา: ระบบบัญชีมินิมัล (Minimal Accounting)

## สถาปัตยกรรม

### เปลี่ยนจากเดิม
- ❌ เดิม: NestJS backend แยก + Next.js frontend แยก
- ✅ ใหม่: **Next.js App Router เดี่ยว** + API Routes ในตัว + Prisma

### โครงสร้างไฟล์เป้าหมาย
```
accnextgen/
├── .cursorrules
├── context.md / plan.md / tasks.md
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── tax.ts
│   │   ├── docNumber.ts
│   │   ├── monthLock.ts
│   │   └── csv.ts
│   └── docTemplates/
│       ├── base.ts
│       ├── quotation.ts
│       ├── invoice.ts
│       ├── taxInvoiceReceipt.ts
│       └── render.ts
├── app/
│   ├── layout.tsx
│   ├── (dashboard)/page.tsx
│   ├── customers/page.tsx
│   ├── orders/page.tsx
│   ├── projects/page.tsx
│   ├── documents/page.tsx
│   ├── finance/page.tsx
│   ├── api/
│   │   ├── customers/route.ts
│   │   ├── customers/[id]/route.ts
│   │   ├── customer-units/route.ts
│   │   ├── orders/route.ts
│   │   ├── orders/[id]/route.ts
│   │   ├── projects/route.ts
│   │   ├── projects/[id]/route.ts
│   │   ├── documents/route.ts
│   │   ├── documents/[id]/route.ts
│   │   ├── documents/[id]/pdf/route.ts
│   │   ├── expenses/route.ts
│   │   ├── payments/route.ts
│   │   ├── reports/vat-sales/route.ts
│   │   ├── reports/vat-purchase/route.ts
│   │   ├── reports/wht/route.ts
│   │   ├── reports/wht-detail/route.ts
│   │   ├── reports/monthly-summary/route.ts
│   │   └── monthly-close/route.ts
│   └── globals.css
├── components/
│   └── ui/ (shadcn components)
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.ts
```

## ขั้นตอนการพัฒนา

### Phase 1: Foundation ✅
1. อัปเดตเอกสารวางแผน (context.md, plan.md, tasks.md)
2. สร้าง Prisma Schema ตาม PRD
3. ตั้งค่า Next.js + Tailwind + shadcn/ui + Zod
4. สร้าง seed.ts

### Phase 2: Core Libraries
5. สร้าง lib/prisma.ts (Prisma Client singleton)
6. สร้าง lib/tax.ts (VAT/WHT calculations)
7. สร้าง lib/docNumber.ts (Document number generator)
8. สร้าง lib/monthLock.ts (Month lock guard)
9. สร้าง lib/csv.ts (CSV export utility)

### Phase 3: API Routes
10. CRUD: customers, customer-units
11. CRUD: orders (+ items, shipment)
12. CRUD: projects (+ milestones)
13. CRUD: documents (+ WHT)
14. CRUD: expenses, payments
15. Reports: vat-sales, vat-purchase, wht, wht-detail
16. Monthly Summary + Monthly Close

### Phase 4: UI Pages
17. Layout + Navigation (sidebar)
18. Dashboard (สรุปรวม)
19. Customers page (CRUD + Units)
20. Orders page (CRUD + Items + Shipment)
21. Projects page (CRUD + Milestones)
22. Documents page (CRUD + PDF button)
23. Finance page (Expenses + Reports + Close Month tabs)

### Phase 5: PDF & Reports
24. HTML Templates (Quotation, Invoice, Tax Invoice/Receipt)
25. Puppeteer PDF route (/api/documents/[id]/pdf)
26. CSV export routes
27. Monthly Summary UI + P&L แยก Goods/Service

### Phase 6: Polish
28. Responsive design
29. Error handling
30. Thai language UI
31. Final testing

## Business Rules สำคัญ

### VAT Calculation
- vatAmount = round(subTotal × vatRate/100, 2)
- grandTotal = subTotal + vatAmount

### WHT Calculation
- whtAmount = round(whtBase × whtRate/100, 2)
- netReceived = grandTotal - whtAmount

### Month Lock
- ถ้าเดือนถูกปิด → ห้ามแก้ Document/Expense/Payment ในเดือนนั้น

### P&L แยก Goods vs Service
- Goods Revenue: Document ที่ผูกกับ orderId
- Service Revenue: Document ที่ผูกกับ projectId
- Shared OPEX กระจายตามสัดส่วนรายได้
