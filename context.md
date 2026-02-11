# Context: ระบบบัญชีมินิมัล (Minimal Accounting & Document System)

## ภาพรวมระบบ

ระบบนี้เป็น **Web Application สำหรับ หจก.** (ห้างหุ้นส่วนจำกัด) ที่ใช้เอง (single company) เพื่อ:

- **ขายผ่านเว็บไซต์** ของตัวเอง (Orders + Shipment)
- **งานบริการ** ออกแบบระบบ/เขียนโปรแกรม (Projects + Milestones)
- **จด VAT 7%** → ต้องออกเอกสารภาษี
- **ลูกค้าส่วนใหญ่เป็น นิติบุคคล/สถานศึกษา** → เจอ WHT (ภาษีหัก ณ ที่จ่าย) บ่อย
- **ออก/พิมพ์ PDF**: ใบเสนอราคา, ใบแจ้งหนี้, ใบกำกับภาษี+ใบเสร็จ
- **สร้าง Project** ได้ และมี **หน่วยงานย่อย** ใต้โรงเรียน/หน่วยงาน (CustomerUnit)

## Business Context

### ธุรกิจ
- ขายสินค้าผ่านเว็บไซต์
- รับจ้างออกแบบระบบ/เขียนโปรแกรม (แบ่งงวดงาน)
- จด VAT 7%
- ลูกค้าหลักคือ นิติบุคคล/สถานศึกษา (มี WHT 3% บ่อย)

### เอกสารที่ต้องออก
1. **ใบเสนอราคา (Quotation)**
2. **ใบแจ้งหนี้ (Invoice)**
3. **ใบกำกับภาษี+ใบเสร็จรับเงิน (Tax Invoice/Receipt)**

### กติกาภาษี
- VAT Rate ค่าเริ่มต้น = 7.00%
- vatAmount = round(subTotal × vatRate/100, 2)
- grandTotal = subTotal + vatAmount
- WHT (บริการเจอบ่อย 3%): whtAmount = round(whtBase × whtRate/100, 2)
- netReceived = grandTotal - whtAmount
- TAX_INVOICE_RECEIPT ออกเมื่อ "รับเงินแล้ว"

## User Roles (มินิมัล v1)
- **Admin/Owner**: ทำทุกอย่าง
- **Staff**: บันทึกรายจ่าย/แนบหลักฐาน/ออกเอกสาร

## ฟีเจอร์หลัก (v1 Must Have)

### 1. Customer / CustomerUnit
- เก็บข้อมูลลูกค้า (บริษัท/สถานศึกษา/บุคคล)
- สร้างหน่วยงานย่อยใต้ลูกค้า (เช่น งานพัสดุ/ฝ่าย IT/โครงการ…)

### 2. Orders (ขายผ่านเว็บ)
- Order + Items
- Shipment (Flash Express ฯลฯ)
- สถานะ: Draft → Invoiced → Paid → Closed / Void

### 3. Projects (งานบริการ)
- Project + Milestones (งวดงาน)
- ออกเอกสารรายงวดได้

### 4. Documents
- DocType: QUOTATION / INVOICE / TAX_INVOICE_RECEIPT
- เก็บ snapshot: subtotal / vat / total ให้ "นิ่ง" และถูกต้อง
- PDF Export A4 ด้วย Puppeteer

### 5. Payments
- รองรับกรณีลูกค้าหัก WHT: รับเงินจริง = grandTotal - whtAmount

### 6. Expenses
- แนบหลักฐานหลายไฟล์
- แยก VAT Input ได้
- ผูกกับ Order/Project ได้ (แยกกำไร Goods vs Service)

### 7. VAT & WHT Reports (CSV)
- รายงานภาษีขาย (VAT Sales) รายเดือน
- รายงานภาษีซื้อ (VAT Purchase) รายเดือน
- รายงาน WHT รายเดือน

### 8. Monthly Close (ล็อกเดือน)
- ปิดเดือนแล้วห้ามแก้รายการในเดือนนั้น

### 9. Monthly Finance Summary
- สรุปรายรับ-รายจ่ายรายเดือน
- สรุป WHT รายเดือน
- P&L (กำไรขาดทุน) แยก Goods vs Service

## Technology Stack

- **Framework**: Next.js App Router + TypeScript
- **ORM**: Prisma
- **Database**: MySQL / MariaDB
- **Styling**: TailwindCSS + shadcn/ui
- **Validation**: Zod
- **PDF**: Puppeteer (HTML → PDF A4)
- **File Storage**: Local disk (DB เก็บ URL)
- **Auth**: Simple/stubbed for v1

## ขอบเขตที่ไม่ทำใน v1
- ระบบสต็อกละเอียด
- e-Tax Invoice/Receipt ตามมาตรฐานเต็ม
- Multi-tenant / SaaS
