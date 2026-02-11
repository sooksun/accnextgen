# 🚀 Quick Setup สำหรับ Localhost

## ✅ การตั้งค่าที่จำเป็น

### 1. Frontend Environment

**ไฟล์**: `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8892
```

### 2. Backend Environment

**ไฟล์**: `.env` (ที่ root directory)

```env
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/accnextgen"
FRONTEND_URL=http://localhost:8891
PORT=8892
NODE_ENV=development
JWT_SECRET=your-secret-key-change-in-production
UPLOAD_DIR=./uploads
```

---

## 🔧 ขั้นตอนการเริ่มใช้งาน

### 1. ตรวจสอบไฟล์ .env.local

```bash
# ตรวจสอบว่า frontend/.env.local มีค่า
cat frontend/.env.local

# ควรเห็น:
# NEXT_PUBLIC_API_URL=http://localhost:8892
```

### 2. ตรวจสอบไฟล์ .env (root)

```bash
# ตรวจสอบว่า .env มีค่า
cat .env

# ควรเห็น:
# DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/accnextgen"
# FRONTEND_URL=http://localhost:8891
# PORT=8892
```

### 3. Start Backend

```bash
cd backend
npm run start:dev
```

Backend จะรันที่: `http://localhost:8892`

### 4. Start Frontend

เปิด terminal ใหม่:

```bash
cd frontend
npm run dev
```

Frontend จะรันที่: `http://localhost:8891`

---

## 🧪 ทดสอบการทำงาน

### 1. ทดสอบ Backend API

```bash
# ทดสอบ health check
curl http://localhost:8892/auth/login

# ควรได้ response (อาจเป็น error 401 ซึ่งปกติ)
```

### 2. ทดสอบ Frontend

1. เปิด browser ไปที่ `http://localhost:8891`
2. ตรวจสอบว่าไม่มี error ใน Console (F12)
3. ลอง login หรือ register user ใหม่

---

## ⚠️ ปัญหาที่อาจพบ

### ปัญหา: ERR_CONNECTION_TIMED_OUT

**สาเหตุ**: Backend ไม่ทำงานหรือ port ไม่ถูกต้อง

**วิธีแก้**:
1. ตรวจสอบว่า backend ทำงานอยู่: `curl http://localhost:8892/auth/login`
2. ตรวจสอบว่า frontend/.env.local มี `NEXT_PUBLIC_API_URL=http://localhost:8892`
3. Restart frontend server (ถ้าแก้ไข .env.local หลัง build)

### ปัญหา: CORS Error

**สาเหตุ**: Backend ไม่ได้ตั้งค่า CORS ให้อนุญาต localhost:8891

**วิธีแก้**:
1. ตรวจสอบว่า `.env` (root) มี `FRONTEND_URL=http://localhost:8891`
2. Restart backend server

### ปัญหา: Cannot connect to database

**สาเหตุ**: MySQL password ไม่ถูกต้องหรือ database ไม่มี

**วิธีแก้**:
1. ทดสอบ MySQL: `mysql -u root -p`
2. ตรวจสอบ `DATABASE_URL` ใน `.env`
3. สร้าง database: `CREATE DATABASE accnextgen;`

---

## 📋 Checklist

ก่อนใช้งานตรวจสอบว่า:

- [ ] `frontend/.env.local` มี `NEXT_PUBLIC_API_URL=http://localhost:8892`
- [ ] `.env` (root) มี `FRONTEND_URL=http://localhost:8891`
- [ ] `.env` (root) มี `DATABASE_URL` ที่ถูกต้อง
- [ ] Backend ทำงานอยู่ที่ `http://localhost:8892`
- [ ] Frontend ทำงานอยู่ที่ `http://localhost:8891`
- [ ] ทดสอบ API ได้ (ไม่มี connection timeout)
- [ ] ไม่มี CORS error
- [ ] Login/Register ทำงานได้

---

## 📝 หมายเหตุ

- **Frontend**: อ่าน `NEXT_PUBLIC_API_URL` จาก `frontend/.env.local` ตอน build time
- **Backend**: อ่าน `.env` จาก root directory (`../.env`)
- หลังจากแก้ไข `.env.local` ต้อง restart frontend dev server
- หลังจากแก้ไข `.env` ต้อง restart backend server

