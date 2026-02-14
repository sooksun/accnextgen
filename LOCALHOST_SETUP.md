# 🏠 คู่มือการตั้งค่าสำหรับ Localhost (Development)

## ✅ การตั้งค่าสำหรับรันบน Localhost

### Frontend
- **URL**: `http://localhost:8891`
- **API URL**: `http://localhost:8892`

### Backend
- **URL**: `http://localhost:8892`
- **CORS Origin**: `http://localhost:8891`

---

## 📝 ไฟล์ที่ต้องตั้งค่า

### 1. Frontend Configuration

**ไฟล์**: `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8892
```

**วิธีสร้างไฟล์**:
```bash
cd frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:8892" > .env.local
```

### 2. Backend Configuration

**ไฟล์**: `.env` (ที่ root directory ของโปรเจกต์)

```env
# Database
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/accnextgen"

# Application
FRONTEND_URL=http://localhost:8891
PORT=8892
NODE_ENV=development

# Security
JWT_SECRET=your-secret-key-change-in-production

# Optional
UPLOAD_DIR=./uploads
```

**วิธีสร้างไฟล์**:
```bash
# ไปที่ root directory ของโปรเจกต์
cd /path/to/accnextgen

# สร้างไฟล์ .env
cat > .env << 'EOF'
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/accnextgen"
FRONTEND_URL=http://localhost:8891
PORT=8892
NODE_ENV=development
JWT_SECRET=your-secret-key-change-in-production
UPLOAD_DIR=./uploads
EOF
```

**หมายเหตุ**: แทนที่ `YOUR_PASSWORD` ด้วย MySQL root password ของคุณ

---

## 🚀 ขั้นตอนการเริ่มต้นใช้งาน

### 1. ตั้งค่า Database

```bash
# ตรวจสอบว่า MySQL ทำงานอยู่
mysql -u root -p

# สร้าง database (ถ้ายังไม่มี)
CREATE DATABASE accnextgen CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Generate Prisma Client

```bash
# ไปที่ root directory
cd /path/to/accnextgen

# Generate Prisma Client
npx prisma generate --schema=prisma/schema.prisma
```

### 3. Run Database Migration

```bash
# Run migration
npx prisma migrate dev --schema=prisma/schema.prisma

# หรือถ้ามี migration file แล้ว
npx prisma migrate deploy --schema=prisma/schema.prisma
```

### 4. Seed Database (Optional)

```bash
# Seed demo data
npx prisma db seed --schema=prisma/schema.prisma
```

### 5. Start Backend

```bash
cd backend

# Development mode (auto-reload)
npm run start:dev

# หรือ Production mode
npm run build
npm run start:prod
```

Backend จะรันที่: `http://localhost:8892`
API Documentation: `http://localhost:8892/api-docs`

### 6. Start Frontend

เปิด terminal ใหม่:

```bash
cd frontend

# Development mode
npm run dev

# หรือ Production mode
npm run build
npm run start
```

Frontend จะรันที่: `http://localhost:8891`

---

## 🔍 ตรวจสอบการตั้งค่า

### ตรวจสอบ Frontend

1. **ตรวจสอบไฟล์ `.env.local`**:
   ```bash
   cat frontend/.env.local
   # หรือ
   Get-Content frontend/.env.local
   ```
   ควรเห็น: `NEXT_PUBLIC_API_URL=http://localhost:8892`

2. **ตรวจสอบ Network Requests**:
   - เปิด Browser Console (F12)
   - ไปที่ Network tab
   - ทำการ login หรือเรียก API
   - ตรวจสอบว่า requests ไปที่ `http://localhost:8892`

### ตรวจสอบ Backend

1. **ตรวจสอบไฟล์ `.env`** (root directory):
   ```bash
   cat .env
   # หรือ
   Get-Content .env
   ```
   ควรเห็น `FRONTEND_URL=http://localhost:8891`

2. **ทดสอบ API**:
   ```bash
   curl http://localhost:8892/auth/login
   ```

3. **ตรวจสอบ CORS**:
   - ดู log เมื่อ start backend
   - ควรแสดงว่า CORS อนุญาต origin: `http://localhost:8891`

---

## 📋 Checklist

ก่อนใช้งานตรวจสอบว่า:

- [ ] MySQL server ทำงานอยู่ (`mysql -u root -p`)
- [ ] Database `accnextgen` ถูกสร้างแล้ว
- [ ] ไฟล์ `.env` อยู่ที่ root directory และตั้งค่าถูกต้อง
- [ ] `DATABASE_URL` ตั้งค่า MySQL password ถูกต้อง
- [ ] ไฟล์ `frontend/.env.local` มี `NEXT_PUBLIC_API_URL=http://localhost:8892`
- [ ] Prisma Client generate แล้ว (`npx prisma generate`)
- [ ] Database migration run แล้ว (`npx prisma migrate dev`)
- [ ] Backend start แล้วและรันที่ `http://localhost:8892`
- [ ] Frontend start แล้วและรันที่ `http://localhost:8891`
- [ ] ทดสอบ login ได้

---

## ⚠️ ปัญหาที่อาจพบ

### ปัญหา: CORS Error

**สาเหตุ**: Backend ไม่ได้ตั้งค่า CORS ให้อนุญาต `localhost:8891`

**วิธีแก้**:
1. ตรวจสอบว่า `.env` (root directory) มี `FRONTEND_URL=http://localhost:8891`
2. Restart backend server

### ปัญหา: Cannot connect to database

**สาเหตุ**: MySQL password ไม่ถูกต้องหรือ database ไม่มี

**วิธีแก้**:
1. ตรวจสอบ `DATABASE_URL` ใน `.env`
2. ทดสอบ connection: `mysql -u root -p`
3. สร้าง database: `CREATE DATABASE accnextgen;`

### ปัญหา: Port already in use

**สาเหตุ**: Port 8891 หรือ 8892 ถูกใช้งานอยู่แล้ว

**วิธีแก้**:
```bash
# หาและ kill process ที่ใช้ port
# Windows (PowerShell)
netstat -ano | findstr :8892
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8892 | xargs kill -9
```

---

## 🔄 สลับระหว่าง Localhost และ Production

### สำหรับ Localhost (Development)

```env
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8892

# .env (root)
FRONTEND_URL=http://localhost:8891
NODE_ENV=development
```

### สำหรับ Production Server

```env
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP:8892

# .env (root)
FRONTEND_URL=http://YOUR_SERVER_IP:8891
NODE_ENV=production
```

**สำคัญ**: หลังจากเปลี่ยนค่าต้อง:
- **Frontend**: Rebuild (`npm run build`) หรือ restart dev server
- **Backend**: Restart server

---

## 📞 ข้อมูลเพิ่มเติม

- ดู `URL_CONFIGURATION.md` สำหรับรายละเอียดเพิ่มเติม
- ดู `USER_PASSWORD_GUIDE.md` สำหรับข้อมูล database user/password
- ดู `FIX_DATABASE_CONNECTION.md` สำหรับแก้ไขปัญหา database connection

