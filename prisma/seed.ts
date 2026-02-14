import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 เริ่ม seed ข้อมูลพื้นฐาน...");

  // ==================== Settings ====================
  const settings = [
    { key: "VAT_RATE", value: "7.00" },
    { key: "DEFAULT_WHT_SERVICE_RATE", value: "3.00" },
    { key: "DOC_PREFIX_QUOT", value: "QT" },
    { key: "DOC_PREFIX_INV", value: "INV" },
    { key: "DOC_PREFIX_TAX", value: "TX" },
    { key: "COMPANY_NAME", value: "หจก. ตัวอย่าง เทคโนโลยี" },
    { key: "COMPANY_TAXID", value: "0123456789012" },
    {
      key: "COMPANY_ADDRESS",
      value:
        "123/45 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110",
    },
    { key: "COMPANY_BRANCH", value: "00000" },
    { key: "CARRIER_DEFAULT", value: "Flash Express" },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }
  console.log("✅ Settings สร้างเรียบร้อย");

  // ==================== Sample Customer: โรงเรียน ====================
  const school = await prisma.customer.upsert({
    where: { id: "cust-school-001" },
    update: {},
    create: {
      id: "cust-school-001",
      name: "โรงเรียนสาธิตแห่งมหาวิทยาลัยตัวอย่าง",
      type: "SCHOOL",
      taxId: "0994000012345",
      address:
        "123 ถ.พหลโยธิน แขวงลาดยาว เขตจตุจักร กรุงเทพมหานคร 10900",
      email: "admin@satit-example.ac.th",
      phone: "02-123-4567",
    },
  });

  // Units ใต้โรงเรียน (3 หน่วย)
  const unitNames = [
    {
      id: "unit-phadsu-001",
      name: "งานพัสดุ",
      contactName: "คุณสมหญิง ใจดี",
      contactPhone: "02-123-4567 ต่อ 101",
      contactEmail: "procurement@satit-example.ac.th",
    },
    {
      id: "unit-it-001",
      name: "ฝ่าย IT",
      contactName: "คุณสมชาย เก่งเทค",
      contactPhone: "02-123-4567 ต่อ 201",
      contactEmail: "it@satit-example.ac.th",
    },
    {
      id: "unit-academic-001",
      name: "ฝ่ายวิชาการ",
      contactName: "อ.สมศรี ปราดเปรื่อง",
      contactPhone: "02-123-4567 ต่อ 301",
      contactEmail: "academic@satit-example.ac.th",
    },
  ];

  for (const unit of unitNames) {
    await prisma.customerUnit.upsert({
      where: { id: unit.id },
      update: {},
      create: {
        ...unit,
        customerId: school.id,
      },
    });
  }
  console.log("✅ Customer + 3 Units สร้างเรียบร้อย");

  // ==================== Sample Customer: บริษัท ====================
  const company = await prisma.customer.upsert({
    where: { id: "cust-company-001" },
    update: {},
    create: {
      id: "cust-company-001",
      name: "บริษัท ดิจิทัล โซลูชั่น จำกัด",
      type: "COMPANY",
      taxId: "0105500012345",
      address:
        "456 อาคารสมาร์ท ชั้น 10 ถ.รัชดาภิเษก แขวงดินแดง เขตดินแดง กรุงเทพมหานคร 10400",
      email: "info@digital-solution.co.th",
      phone: "02-987-6543",
    },
  });
  console.log("✅ Customer บริษัท สร้างเรียบร้อย");

  // ==================== Sample Order ====================
  const order = await prisma.order.upsert({
    where: { id: "order-sample-001" },
    update: {},
    create: {
      id: "order-sample-001",
      code: "ORD-2602-0001",
      customerId: company.id,
      status: "DRAFT",
      orderDate: new Date("2026-02-01"),
      subTotal: 15000,
      vatRate: 7,
      vatAmount: 1050,
      grandTotal: 16050,
      items: {
        create: [
          {
            name: "เมาส์ไร้สาย Logitech M590",
            qty: 5,
            unitPrice: 1200,
            lineTotal: 6000,
          },
          {
            name: "คีย์บอร์ด Mechanical TKL",
            qty: 3,
            unitPrice: 3000,
            lineTotal: 9000,
          },
        ],
      },
    },
  });
  console.log("✅ Order ตัวอย่าง สร้างเรียบร้อย");

  // ==================== Sample Project ====================
  const project = await prisma.project.upsert({
    where: { id: "project-sample-001" },
    update: {},
    create: {
      id: "project-sample-001",
      code: "PRJ-2602-0001",
      customerId: school.id,
      unitId: "unit-it-001",
      title: "พัฒนาระบบจัดการเรียนการสอนออนไลน์",
      startDate: new Date("2026-02-01"),
      endDate: new Date("2026-06-30"),
      milestones: {
        create: [
          {
            title: "งวดที่ 1: วิเคราะห์ระบบและออกแบบ",
            amount: 50000,
            dueDate: new Date("2026-03-01"),
            isBilled: false,
          },
          {
            title: "งวดที่ 2: พัฒนาระบบ",
            amount: 100000,
            dueDate: new Date("2026-04-30"),
            isBilled: false,
          },
          {
            title: "งวดที่ 3: ทดสอบและส่งมอบ",
            amount: 50000,
            dueDate: new Date("2026-06-30"),
            isBilled: false,
          },
        ],
      },
    },
  });
  console.log("✅ Project ตัวอย่าง สร้างเรียบร้อย");

  console.log("\n🎉 Seed เสร็จสมบูรณ์!");
  console.log("  - Settings: 10 รายการ");
  console.log("  - Customers: 2 ราย (โรงเรียน + บริษัท)");
  console.log("  - CustomerUnits: 3 หน่วยงาน");
  console.log("  - Orders: 1 ออเดอร์ (พร้อม 2 items)");
  console.log("  - Projects: 1 โครงการ (พร้อม 3 งวดงาน)");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
