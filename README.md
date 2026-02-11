# ระบบบันทึกรายรับ-รายจ่ายสำหรับโรงเรียน

ระบบ Web Application สำหรับจัดการการเงินของโรงเรียน พร้อมฟีเจอร์ AI Vision สำหรับอ่านสลิป/ใบเสร็จอัตโนมัติ

## ✨ คุณสมบัติหลัก

- ✅ บันทึกรายรับ-รายจ่ายแบบ Manual
- ✅ อัปโหลดสลิป/ใบเสร็จและใช้ AI Vision อ่านข้อมูลอัตโนมัติ
- ✅ รองรับหลายปีการศึกษา (Multi-Academic-Year)
- ✅ รองรับสมาชิกหลายประเภท (Admin, Finance, Teacher, Staff, Auditor)
- ✅ Dashboard และ Board สำหรับวิเคราะห์ข้อมูล
- ✅ ฟิลเตอร์ตามปีการศึกษาและช่วงวันที่
- ✅ แสดงสรุปยอดรวม (รับ, จ่าย, สุทธิ)

## 🛠️ Technology Stack

### Frontend
- **Next.js 16** (App Router)
- **TypeScript**
- **TailwindCSS**
- **React 18**

### Backend
- **NestJS** (Latest)
- **Prisma ORM**
- **MySQL**

### AI/ML
- **OpenAI Vision API** (พร้อมเชื่อมต่อ - ใช้ stub ตอนนี้)

## 📋 ข้อกำหนดเบื้องต้น

- Node.js 18+ (LTS)
- MySQL 8.0+
- npm หรือ yarn

## 🚀 วิธีติดตั้งและรัน

### 1. ติดตั้ง Dependencies

```bash
# ติดตั้ง dependencies สำหรับ root (Prisma)
npm install

# ติดตั้ง dependencies สำหรับ Backend
cd backend
npm install

# ติดตั้ง dependencies สำหรับ Frontend
cd ../frontend
npm install
```

### 2. ตั้งค่า Database

สร้างไฟล์ `.env` ใน root directory:

```env
DATABASE_URL="mysql://user:password@localhost:3306/school_finance?schema=public"
OPENAI_API_KEY="your_openai_api_key_here"
AI_VISION_MODEL="gpt-4-vision-preview"
```

**หมายเหตุ:** เปลี่ยน `user`, `password`, และ `localhost:3306` ให้ตรงกับ MySQL ของคุณ

### 3. สร้าง Database Schema

```bash
# กลับไปที่ root directory
cd ..

# Generate Prisma Client
npm run prisma:generate

# สร้าง migration และ tables
npm run prisma:migrate

# Seed demo data
npm run prisma:seed
```

### 4. รัน Backend

```bash
cd backend

# Development mode
npm run start:dev

# Backend จะรันที่ http://localhost:8892
```

### 5. รัน Frontend

เปิด terminal ใหม่:

```bash
cd frontend

# Development mode
npm run dev

# Frontend จะรันที่ http://localhost:8891
```

### 6. เปิดใช้งานระบบ

เปิดเบราว์เซอร์ไปที่ `http://localhost:8891`

## 📁 โครงสร้างโปรเจกต์

```
accnextgen/
├── backend/                 # NestJS Backend
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── prisma/
│   │   ├── users/
│   │   ├── academic-years/
│   │   ├── categories/
│   │   ├── transactions/
│   │   ├── attachments/
│   │   └── slip-ocr/
│   └── package.json
├── frontend/                # Next.js Frontend
│   ├── app/
│   │   ├── page.tsx        # Dashboard
│   │   ├── transactions/   # หน้ารายการ
│   │   ├── board/          # หน้าบอร์ด
│   │   └── settings/       # หน้าตั้งค่า
│   ├── components/         # React Components
│   ├── lib/                # API Client
│   └── package.json
├── prisma/                 # Prisma Schema & Seed
│   ├── schema.prisma
│   └── seed.ts
├── .cursorrules           # กติกาสำหรับ Cursor AI
├── context.md             # บริบทระบบ
├── plan.md                # แผนการพัฒนา
├── tasks.md               # รายการงาน
└── README.md              # เอกสารนี้
```

## 🔌 API Endpoints

### Transactions
- `GET /transactions` - รายการ Transaction (รองรับ filters และ pagination)
- `GET /transactions/summary` - สรุปยอดรวม
- `GET /transactions/board/category` - Board แยกตามหมวดหมู่
- `GET /transactions/board/member` - Board แยกตามผู้บันทึก
- `POST /transactions` - สร้าง Transaction (Manual)
- `POST /transactions/from-slip` - อัปโหลดสลิปและสร้าง Transaction อัตโนมัติ

### Users
- `GET /users` - รายการ Users
- `GET /users/:id` - ข้อมูล User

### Academic Years
- `GET /academic-years` - รายการปีการศึกษา
- `GET /academic-years/active` - ปีการศึกษาปัจจุบัน

### Categories
- `GET /categories` - รายการหมวดหมู่
- `GET /categories?type=INCOME` - หมวดหมู่รายรับ
- `GET /categories?type=EXPENSE` - หมวดหมู่รายจ่าย

## 🤖 AI Vision Integration

ระบบรองรับการอ่านสลิป/ใบเสร็จด้วย AI Vision โดยใช้ OpenAI GPT-4 Vision API

### วิธีเชื่อมต่อ (ในอนาคต)

1. ตั้งค่า `OPENAI_API_KEY` ใน `.env`
2. Uncomment โค้ดใน `backend/src/slip-ocr/slip-ocr.service.ts`
3. ติดตั้ง package: `npm install openai` (ใน backend)

**หมายเหตุ:** ตอนนี้ใช้ stub data สำหรับทดสอบ ยังไม่ได้เชื่อมต่อกับ API จริง

## 📊 Demo Data

ระบบมี demo data ที่สร้างจาก `prisma/seed.ts`:

- **Users**: Admin, Finance, Teacher, Staff
- **Academic Years**: ปีการศึกษา 2567, 2568
- **Categories**: หมวดหมู่รายรับ-รายจ่าย
- **Transactions**: ตัวอย่างรายการ

## 🔐 Authentication

ระบบมีระบบ Authentication พร้อมใช้งาน:

- **JWT Authentication** - Token หมดอายุใน 7 วัน
- **Password Security** - Hash ด้วย bcrypt
- **Auto User Assignment** - ผู้ใช้ที่ sign in จะถูกใช้เป็นผู้บันทึกอัตโนมัติ
- **Protected Routes** - Transactions routes ต้อง login

### การตั้งค่า JWT

เพิ่มใน `.env`:
```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### API Endpoints

- `POST /auth/login` - เข้าสู่ระบบ
- `POST /auth/register` - สมัครสมาชิก
- `GET /auth/profile` - ข้อมูลผู้ใช้ (ต้องมี JWT token)

## 📝 หมายเหตุ

- ข้อมูลทั้งหมดเก็บใน MySQL ผ่าน Prisma
- ไม่มี mock data นอก database
- ทุก Transaction ต้องผูกกับปีการศึกษา
- ระบบรองรับการใช้งานหลายคนพร้อมกัน

## 🐛 Troubleshooting

### Database Connection Error
- ตรวจสอบ `DATABASE_URL` ใน `.env`
- ตรวจสอบว่า MySQL service กำลังทำงาน
- ตรวจสอบ username/password และ database name

### Prisma Generate Error
- ลบโฟลเดอร์ `node_modules` และ `package-lock.json`
- รัน `npm install` ใหม่
- รัน `npm run prisma:generate` ใหม่

### Port Already in Use
- Backend default: `8892`
- Frontend default: `8891`
- เปลี่ยน port ใน `backend/src/main.ts` (PORT environment variable) หรือ `frontend/package.json` (scripts)

## 📚 เอกสารเพิ่มเติม

- [Prisma Documentation](https://www.prisma.io/docs)
- [NestJS Documentation](https://docs.nestjs.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)

## 👥 ผู้พัฒนา

ระบบนี้พัฒนาด้วย Cursor AI ตาม requirement ที่กำหนด

## 📄 License

ISC

---

**Happy Coding! 🚀**

