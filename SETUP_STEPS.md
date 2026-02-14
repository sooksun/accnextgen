# ขั้นตอนติดตั้ง AccNextGen บนเซิร์ฟเวอร์ (Step-by-Step)

คู่มือนี้ใช้สำหรับ deploy โปรเจกต์บนโฮสต์ที่ใช้ **Node.js + Passenger** (เช่น solution-nextgen.co.th)

---

## สิ่งที่ต้องเตรียมก่อน

- [ ] เซิร์ฟเวอร์มี **Node.js 20.x** ขึ้นไป (แนะนำ 20.19 LTS หรือ 22.x)
- [ ] มี **MySQL** หรือ MariaDB บนเซิร์ฟเวอร์ (หรือใช้ remote DB)
- [ ] มี **Application** ใน Node.js selector แล้ว (หรือจะสร้างใหม่ตามขั้นตอน)
- [ ] รู้ **username** และ path home บนเซิร์ฟเวอร์ (เช่น `solutio9` → `/home/solutio9`)

---

## Step 1: Build บนเครื่องพัฒนา (Windows/Local)

บนเครื่องที่ clone โปรเจกต์ไว้:

```bash
cd d:\laragon\www\accnextgen   # หรือ path โปรเจกต์ของคุณ

# ติดตั้ง dependencies (ถ้ายังไม่ได้ติดตั้ง)
npm ci

# Build โปรเจกต์
npm run build
```

ตรวจสอบว่ามีโฟลเดอร์ `.next` เกิดขึ้นหลัง build

---

## Step 2: เตรียมไฟล์สำหรับอัปโหลด

ไฟล์/โฟลเดอร์ที่**ต้องมี**บนเซิร์ฟเวอร์:

| รายการ | หมายเหตุ |
|--------|----------|
| `package.json` | จำเป็น |
| `package-lock.json` | จำเป็น (ให้ใช้ version เดียวกับที่ build) |
| `server.js` | จุดสตาร์ทแอปสำหรับ Passenger |
| `.next/` | โฟลเดอร์หลัง build (ต้องอัปโหลดหรือ build บนเซิร์ฟเวอร์) |
| `prisma/` | โฟลเดอร์ schema + migrations |
| `app/`, `components/`, `src/` | โค้ดแอป (ต้องมีครบ) |
| `public/` | ถ้ามี |
| `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js` | config ต่างๆ |

**ทางเลือกการส่งไฟล์:**

- **วิธี A:** อัปโหลดผ่าน FTP/SFTP/File Manager (รวมโฟลเดอร์ `.next` และ `node_modules` จากเครื่องที่ build แล้ว) — ไฟล์ใหญ่
- **วิธี B (แนะนำ):** ใช้ Git — บนเซิร์ฟเวอร์ clone/pull จาก repo แล้วรัน `npm ci` และ `npm run build` บนเซิร์ฟเวอร์ (ไม่ต้องอัปโหลด `.next`)

---

## Step 3: สร้างโฟลเดอร์แอปบนเซิร์ฟเวอร์

1. เข้าเซิร์ฟเวอร์ผ่าน SSH หรือใช้ File Manager ของโฮสต์
2. สร้างโฟลเดอร์แอป เช่น:
   ```bash
   mkdir -p /home/solutio9/accnextgen
   cd /home/solutio9/accnextgen
   ```
3. ถ้าใช้ Git:
   ```bash
   git clone https://github.com/sooksun/accnextgen.git .
   # หรือ git pull ถ้ามี repo อยู่แล้ว
   ```

---

## Step 4: ติดตั้ง Dependencies และ Build บนเซิร์ฟเวอร์

ในโฟลเดอร์แอป (`/home/solutio9/accnextgen`):

**กรณี A — อัปโหลดโปรเจกต์ที่ build แล้วจากเครื่องตัวเอง (มีโฟลเดอร์ `.next` มาด้วย):**

```bash
npm ci --omit=dev
```
ไม่ต้องรัน `npm run build` อีก

**กรณี B — ใช้ Git (clone/pull) โดยไม่มีโฟลเดอร์ `.next`:**

ต้อง build บนเซิร์ฟเวอร์ (ใช้ devDependencies ชั่วคราว):

```bash
npm ci
npm run build
npm prune --production
```

---

## Step 5: ตั้งค่า Environment (.env)

1. คัดลอกไฟล์ตัวอย่างสำหรับเซิร์ฟเวอร์:
   ```bash
   cp .env.server.example .env
   ```
2. แก้ไข `.env` ให้ตรงกับเซิร์ฟเวอร์:
   - `DATABASE_URL` — user, password, host, ชื่อ database จริง
   - `NEXT_PUBLIC_APP_URL` — URL ที่ผู้ใช้เข้า (เช่น `https://solution-nextgen.co.th`)
   - `UPLOAD_DIR` — path โฟลเดอร์เก็บไฟล์อัปโหลด (ควรเป็น absolute path)
   - `NODE_ENV=production`

ตัวอย่าง:

```env
NODE_ENV=production
DATABASE_URL="mysql://dbuser:dbpassword@localhost:3306/accnextgen"
NEXT_PUBLIC_APP_URL="https://solution-nextgen.co.th"
UPLOAD_DIR="/home/solutio9/accnextgen/uploads"
```

3. สร้างโฟลเดอร์ uploads และตั้งสิทธิ์ถ้าจำเป็น:
   ```bash
   mkdir -p uploads
   chmod 755 uploads
   ```

---

## Step 6: ตั้งค่า Database

1. สร้าง database บน MySQL (ถ้ายังไม่มี):
   ```sql
   CREATE DATABASE accnextgen CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'accuser'@'localhost' IDENTIFIED BY 'รหัสผ่านที่แข็งแรง';
   GRANT ALL ON accnextgen.* TO 'accuser'@'localhost';
   FLUSH PRIVILEGES;
   ```
2. รัน migration:
   ```bash
   npx prisma migrate deploy
   ```
3. (ถ้าต้องการข้อมูลตัวอย่าง) รัน seed:
   ```bash
   npx prisma db seed
   ```

---

## Step 7: ตั้งค่า Application ใน Node.js Selector (Passenger)

ในหน้า **Create/Edit Application** ใส่ค่าตามนี้ (แทน `solutio9` ด้วย username จริง):

| ช่อง | ค่าที่ใส่ |
|------|-----------|
| **Application root** | `/home/solutio9/accnextgen` |
| **Application URL** | `solution-nextgen.co.th` หรือ subdomain ที่ใช้ |
| **Application startup file** | `server.js` |
| **Passenger log file** | `/home/solutio9/logs/passenger.log` |

จากนั้นบันทึกและเปิด/รีสตาร์ทแอป

---

## Step 8: ตรวจสอบการทำงาน

1. เปิดเบราว์เซอร์ไปที่ Application URL ที่ตั้งไว้
2. ตรวจสอบว่าหน้าแรกโหลดได้
3. ถ้า error: เปิดดู **Passenger log file** ที่ตั้งไว้ เพื่อดูข้อความ error

---

## สรุปคำสั่งบนเซิร์ฟเวอร์ (รวบรวม)

```bash
cd /home/solutio9/accnextgen

# ถ้าใช้ Git
git pull
npm ci
npm run build
npm prune --production

# ตั้งค่า .env (แก้ค่าข้างในให้ตรง)
cp .env.server.example .env
nano .env   # หรือ vi

# Database
npx prisma migrate deploy
# (ถ้าต้องการ) npx prisma db seed

# สร้างโฟลเดอร์ uploads
mkdir -p uploads
chmod 755 uploads
```

จากนั้นตั้งค่า Application ใน panel ตาม Step 7 แล้วรีสตาร์ทแอป

---

## ไฟล์อ้างอิง

- **DEPLOY_SERVER.md** — รายละเอียดความหมายแต่ละช่องในฟอร์ม Application
- **.env.server.example** — ตัวอย่างตัวแปรสภาพแวดล้อมสำหรับ production
- **DATABASE_CONFIG.md** — การตั้งค่า MySQL/Prisma (ถ้ามีในโปรเจกต์)
