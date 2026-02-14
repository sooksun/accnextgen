# แก้ปัญหา Deploy บน CloudLinux NodeJS Selector

## สาเหตุของ Error 500

จากภาพที่ส่งมา มี 3 ปัญหาหลัก:

### 1. CloudLinux ไม่อนุญาตให้มีโฟลเดอร์ `node_modules` ใน Application root

**ข้อความ Error:**
> Cloudlinux NodeJS Selector demands to store node modules for application in separate folder (virtual environment) pointed by symlink called "node_modules". That's why application should not contain folder/file with such name in application root.

**วิธีแก้:**
- **ลบโฟลเดอร์ `node_modules`** ออกจาก `/accnextgen` (หรือ path Application root ของคุณ) ถ้ามีอยู่
- ใช้ปุ่ม **"Run NPM Install"** ใน panel แทน — ระบบจะติดตั้งไปที่ virtual environment และสร้าง symlink ให้เอง

---

### 2. Permission denied ตอน build

**ข้อความ Error:**
> sh: /home/solutio9/accnextgen/node_modules/bin/next: Permission denied

เกิดจาก `node_modules` อยู่ใน app root (ซึ่ง CloudLinux ไม่รองรับ) หรือสิทธิ์ไฟล์ไม่ถูกต้อง

**วิธีแก้:**
1. ลบ `node_modules` ออกจาก Application root
2. กด **"Run NPM Install"** ใน panel
3. **อย่ารัน build บนเซิร์ฟเวอร์** — ให้อัปโหลดโฟลเดอร์ `.next` ที่ build แล้วจากเครื่องตัวเองแทน (เพราะ build บนเซิร์ฟเวอร์อาจมีปัญหา permission)

---

### 3. เข้าเว็บผิด URL

ถ้าเข้า `solution-nextgen.co.th/public` อาจไปโดน Laravel หรือ static files แทน Node app

**วิธีแก้:**
- เข้า **`https://solution-nextgen.co.th`** (ไม่มี `/public`)
- Node app ควรรันที่ root ของโดเมน ไม่ใช่ subpath

---

## ขั้นตอนแก้ไข (ทำตามลำดับ)

### Step 1: ลบ node_modules บนเซิร์ฟเวอร์

ผ่าน FTP หรือ File Manager:
- ไปที่ `/accnextgen` (หรือ `/home/solutio9/accnextgen`)
- **ลบโฟลเดอร์ `node_modules`** ถ้ามี

### Step 2: ตรวจสอบว่ามี .next ครบ

โฟลเดอร์ `.next` ต้องมีและ build แล้วจากเครื่องตัวเอง ประกอบด้วย:
- `.next/static/`
- `.next/server/`
- ไฟล์อื่นๆ ใน `.next/`

ถ้ายังไม่มี: บนเครื่องตัวเองรัน `npm run build` แล้วอัปโหลดโฟลเดอร์ `.next` ขึ้นไป

### Step 3: Run NPM Install ใน Panel

ในหน้า Node.js Application:
- กดปุ่ม **"Run NPM Install"**
- รอให้ติดตั้งเสร็จ (ระบบจะสร้าง symlink `node_modules` ให้เอง)

### Step 4: อย่ารัน Build บนเซิร์ฟเวอร์

- **ไม่ต้อง** กด Run Build หรือรัน `npm run build` บนเซิร์ฟเวอร์
- ใช้ `.next` ที่ build จากเครื่องตัวเองเท่านั้น

### Step 5: Restart App

- กด **RESTART** ใน panel
- เปิด Passenger log (`/home/solutio9/logs/passenger.log`) ดูว่ามี error หรือไม่

### Step 6: ทดสอบเข้าเว็บ

- เปิด **`https://solution-nextgen.co.th`** (ไม่มี `/public`)
- ถ้ายัง 500 อยู่ ให้ดู Passenger log เพื่อดู error message

---

## สรุปไฟล์ที่ควรมีบนเซิร์ฟเวอร์

| มี | ไม่มี |
|----|-------|
| `app/`, `components/`, `src/`, `prisma/` | `node_modules/` (ให้ panel สร้าง) |
| `.next/` (build จากเครื่องตัวเอง) | |
| `server.js`, `package.json`, `package-lock.json` | |
| `next.config.ts`, `tsconfig.json`, etc. | |
| `.env` (สร้างบนเซิร์ฟเวอร์) | |

---

## ถ้ายัง Error อยู่

1. ดู **Passenger log**: `/home/solutio9/logs/passenger.log`
2. ตรวจสอบ **Application root** ว่าเป็น `accnextgen` หรือ `/home/solutio9/accnextgen` ตามที่โฮสต์กำหนด
3. ตรวจสอบ **.env** ว่ามี `DATABASE_URL` ถูกต้อง และ MySQL พร้อมใช้งาน
