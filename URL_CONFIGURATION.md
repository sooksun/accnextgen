# 🌐 การตั้งค่า URL สำหรับ Frontend และ Backend

## ✅ การตั้งค่าสำหรับ Localhost (Development)

### Frontend
- **URL**: `http://localhost:8891`
- **API URL**: `http://localhost:8892` (ตั้งใน `frontend/.env.local`)

### Backend
- **URL**: `http://localhost:8892`
- **CORS Origin**: `http://localhost:8891` (ตั้งใน `.env` ที่ root directory)

## ✅ การตั้งค่าสำหรับ Production Server

### Frontend
- **URL**: `http://YOUR_SERVER_IP:8891`
- **API URL**: `http://YOUR_SERVER_IP:8892` (ตั้งใน `frontend/.env.local`)

### Backend
- **URL**: `http://YOUR_SERVER_IP:8892`
- **CORS Origin**: `http://YOUR_SERVER_IP:8891` (ตั้งใน `.env` ที่ root directory)

---

## 📝 ไฟล์ที่ต้องตั้งค่า

### 1. Frontend Configuration

**ไฟล์**: `frontend/.env.local`

```env
# สำหรับ Localhost (Development)
NEXT_PUBLIC_API_URL=http://localhost:8892

# สำหรับ Production Server
# NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP:8892
```

**วิธีตั้งค่า**:
```bash
cd frontend
# สำหรับ Localhost
echo "NEXT_PUBLIC_API_URL=http://localhost:8892" > .env.local

# หรือสำหรับ Production Server
# echo "NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP:8892" > .env.local
```

**สำคัญ**: หลังเปลี่ยนไฟล์นี้ต้อง rebuild frontend:
```bash
npm run build
# หรือ restart dev server
npm run dev
```

### 2. Backend Configuration

**ไฟล์**: `.env` (ที่ root directory ของโปรเจกต์)

```env
# สำหรับ Localhost (Development)
FRONTEND_URL=http://localhost:8891
PORT=8892
NODE_ENV=development
JWT_SECRET=your-secret-key-change-in-production

# สำหรับ Production Server
# FRONTEND_URL=http://YOUR_SERVER_IP:8891
# PORT=8892
# NODE_ENV=production
# JWT_SECRET=your-very-secure-secret-key-change-in-production
```

**วิธีตั้งค่า**:
```bash
# ไปที่ root directory ของโปรเจกต์
cd /path/to/accnextgen

# สร้างไฟล์ .env (สำหรับ Localhost)
cat > .env << EOF
FRONTEND_URL=http://localhost:8891
PORT=8892
NODE_ENV=development
JWT_SECRET=your-secret-key-change-in-production
DATABASE_URL=mysql://root:YOUR_PASSWORD@localhost:3306/accnextgen
EOF
```

**หมายเหตุ**: Backend อ่าน `.env` จาก **root directory** (`../.env`) ไม่ใช่ `backend/.env` (ดู `backend/src/app.module.ts`)

**สำคัญ**: หลังเปลี่ยนไฟล์นี้ต้อง restart backend:
```bash
npm run start:prod
# หรือ
npm run start:dev
```

---

## 🔍 ตรวจสอบการตั้งค่า

### ตรวจสอบ Frontend

1. **ตรวจสอบไฟล์ `.env.local`**:
   ```bash
   cat frontend/.env.local
   # หรือ
   Get-Content frontend/.env.local
   ```

2. **ตรวจสอบว่า Frontend ใช้ API URL ถูกต้อง**:
   - เปิด Browser Console (F12)
   - ไปที่ Network tab
   - ทำการ login หรือเรียก API
   - ตรวจสอบว่า requests ไปที่ `http://203.172.184.47:8892`

### ตรวจสอบ Backend

1. **ตรวจสอบไฟล์ `.env`**:
   ```bash
   cat backend/.env
   # หรือ
   Get-Content backend/.env
   ```

2. **ตรวจสอบ CORS Configuration**:
   - ดู log เมื่อ start backend
   - ควรแสดงว่า CORS อนุญาต origin: `http://203.172.184.47:8891`

3. **ทดสอบ API**:
   ```bash
   curl http://203.172.184.47:8892/auth/login
   ```

---

## 🚀 ขั้นตอนการเริ่มต้นใช้งาน

### 1. ตั้งค่า Frontend

```bash
cd frontend

# สร้าง/อัพเดท .env.local
echo "NEXT_PUBLIC_API_URL=http://203.172.184.47:8892" > .env.local

# Rebuild (ถ้าใช้ production)
npm run build

# Start server
npm run start
# หรือสำหรับ development
npm run dev
```

### 2. ตั้งค่า Backend

```bash
cd backend

# สร้าง/อัพเดท .env (ถ้ายังไม่มี)
cat > .env << EOF
FRONTEND_URL=http://203.172.184.47:8891
PORT=8892
NODE_ENV=production
JWT_SECRET=your-secret-key-change-in-production
EOF

# Start server
npm run start:prod
# หรือสำหรับ development
npm run start:dev
```

### 3. ทดสอบการเข้าถึง

**Localhost (Development)**:
```
http://localhost:8891
```

**Production Server**:
```
http://YOUR_SERVER_IP:8891
```

**หมายเหตุ**: สำหรับ iPhone/Mobile ที่ต้องการเข้าถึงจากอุปกรณ์อื่น:
- ใช้ IP address ของ server แทน localhost
- ตรวจสอบว่า server อนุญาตให้เข้าถึงจาก network ได้
- ตรวจสอบ firewall settings

---

## ⚠️ ปัญหาที่อาจพบและวิธีแก้

### ปัญหา: CORS Error

**สาเหตุ**: Backend ไม่ได้ตั้งค่า CORS ให้อนุญาต frontend URL

**วิธีแก้**:
1. ตรวจสอบว่า `.env` (root directory) มี `FRONTEND_URL=http://localhost:8891` (หรือ IP ของ server ในกรณี production)
2. Restart backend server

### ปัญหา: API calls ไปที่ localhost แทน IP

**สาเหตุ**: Frontend ไม่ได้อ่านค่า `NEXT_PUBLIC_API_URL` จาก `.env.local`

**วิธีแก้**:
1. ตรวจสอบว่า `frontend/.env.local` มีค่า `NEXT_PUBLIC_API_URL=http://localhost:8892` (หรือ IP ของ server ในกรณี production)
2. Rebuild frontend: `npm run build`
3. Restart frontend server

### ปัญหา: Connection Refused

**สาเหตุ**: Backend ไม่ทำงานหรือ port ถูกบล็อก

**วิธีแก้**:
1. ตรวจสอบว่า backend ทำงานอยู่: `curl http://localhost:8892/auth/login` (หรือ IP ของ server ในกรณี production)
2. ตรวจสอบ firewall: `sudo ufw status`
3. เปิด port ถ้าจำเป็น: `sudo ufw allow 8892`

---

## 📋 Checklist

ก่อนใช้งานตรวจสอบว่า:

- [ ] `frontend/.env.local` มี `NEXT_PUBLIC_API_URL=http://localhost:8892` (หรือ IP ของ server)
- [ ] Frontend rebuild แล้ว (`npm run build` สำหรับ production หรือ `npm run dev` สำหรับ development)
- [ ] `.env` (root directory) มี `FRONTEND_URL=http://localhost:8891` (หรือ IP ของ server)
- [ ] Backend restart แล้ว
- [ ] Port 8891 และ 8892 เปิดอยู่
- [ ] ไม่มี firewall block
- [ ] ทดสอบได้บน Desktop browser
- [ ] ทดสอบได้บน iPhone/mobile

---

## 🔄 การเปลี่ยน URL (Migration)

หากต้องการเปลี่ยน IP address หรือ domain:

1. **อัพเดท Frontend**:
   ```bash
   # แก้ไข frontend/.env.local
   NEXT_PUBLIC_API_URL=http://NEW_IP:8892
   # Rebuild
   npm run build
   ```

2. **อัพเดท Backend**:
   ```bash
   # แก้ไข backend/.env
   FRONTEND_URL=http://NEW_IP:8891
   # Restart
   npm run start:prod
   ```

3. **ทดสอบการทำงาน**

---

## 📞 ข้อมูลเพิ่มเติม

- ดู `SETUP_ENV_GUIDE.md` สำหรับคู่มือการตั้งค่าแบบละเอียด
- ดู `MOBILE_ERROR_FIX.md` สำหรับแก้ไขปัญหา mobile

