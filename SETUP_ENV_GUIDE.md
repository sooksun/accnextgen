# 📝 คู่มือการตั้งค่า NEXT_PUBLIC_API_URL สำหรับ Mobile

## ✅ ขั้นตอนการตั้งค่า

### 1. สร้างไฟล์ `.env.local`

ไฟล์ `.env.local` ถูกสร้างไว้แล้วใน `frontend/.env.local`

### 2. ตรวจสอบเนื้อหาในไฟล์

เปิดไฟล์ `frontend/.env.local` และตรวจสอบว่ามีเนื้อหาดังนี้:

```env
# สำหรับ Localhost (Development)
NEXT_PUBLIC_API_URL=http://localhost:8892

# สำหรับ Production Server
# NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP:8892
```

**หมายเหตุ**: 
- สำหรับ **Development**: ใช้ `http://localhost:8892`
- สำหรับ **Production**: แทนที่ `YOUR_SERVER_IP` ด้วย IP address จริงของ backend server
- Port `8892` คือ port ของ backend API

### 3. สำหรับ Production ผ่าน HTTPS

หากต้องการใช้ HTTPS (แนะนำสำหรับ production):

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### 4. Rebuild Frontend

**สำคัญ**: หลังจากเปลี่ยน `.env.local` ต้อง rebuild frontend เสมอ!

#### ถ้าใช้ Development Mode:

```bash
cd frontend
npm run dev
```

#### ถ้าใช้ Production Mode:

```bash
cd frontend

# Build ใหม่
npm run build

# Start server
npm run start
```

**คำเตือน**: 
- Next.js จะอ่าน environment variables จาก `.env.local` เมื่อ build time
- ถ้าใช้ `npm run dev` จะอ่านค่าใหม่ทุกครั้งที่ restart
- ถ้าใช้ `npm run build` และ `npm run start` ต้อง rebuild ทุกครั้งที่เปลี่ยนค่า

### 5. ตรวจสอบว่า Frontend ใช้ค่า API URL ถูกต้อง

เปิด browser console (F12) และตรวจสอบ:

1. ไปที่หน้าเว็บ `http://localhost:8891` (หรือ IP ของ server ในกรณี production)
2. เปิด Developer Tools (F12)
3. ไปที่ tab "Network"
4. ลอง login หรือทำ action ใดๆ
5. ตรวจสอบว่า API requests ไปที่ `http://localhost:8892` (หรือ IP ของ server ในกรณี production)

### 6. ตรวจสอบ Backend CORS

ตรวจสอบว่า backend อนุญาตให้ frontend IP เข้าถึงได้:

**ไฟล์**: `backend/src/main.ts`

ตรวจสอบว่า CORS configuration มี:
```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8891',
  credentials: true,
  // ...
})
```

**ตั้งค่า environment variable ใน backend**:

สร้างไฟล์ `.env` ที่ root directory (ถ้ายังไม่มี) และเพิ่ม:
```env
# สำหรับ Localhost (Development)
FRONTEND_URL=http://localhost:8891

# สำหรับ Production Server
# FRONTEND_URL=http://YOUR_SERVER_IP:8891
```

**หมายเหตุ**: Backend อ่าน `.env` จาก **root directory** (`../.env`) ไม่ใช่ `backend/.env`

จากนั้น restart backend server

### 7. ทดสอบบน iPhone

1. ตรวจสอบว่า iPhone อยู่ในเครือข่ายเดียวกันกับ server หรือสามารถเข้าถึง IP ได้
2. เปิด Safari บน iPhone
3. เข้าไปที่ `http://YOUR_SERVER_IP:8891` (สำหรับ production) หรือใช้ localhost ถ้าใช้เครื่องเดียวกัน
4. ลอง login หรือใช้งานฟีเจอร์ต่างๆ

## 🔍 การตรวจสอบปัญหา

### ปัญหา: ยังใช้งานไม่ได้บน iPhone

**ตรวจสอบ 1**: Frontend build ใหม่แล้วหรือยัง?
```bash
cd frontend
npm run build
```

**ตรวจสอบ 2**: API URL ถูกต้องใน `.env.local`?
```bash
cat frontend/.env.local
# หรือ
Get-Content frontend/.env.local
```

**ตรวจสอบ 3**: Backend CORS ตั้งค่าถูกต้อง?
- ตรวจสอบ `.env` (root directory) ว่ามี `FRONTEND_URL=http://localhost:8891` (หรือ IP ของ server ในกรณี production)
- Restart backend server

**ตรวจสอบ 4**: Port เปิดอยู่หรือไม่?
```bash
# ทดสอบว่า backend ทำงานอยู่ (Localhost)
curl http://localhost:8892/auth/login

# ทดสอบว่า frontend ทำงานอยู่ (Localhost)
curl http://localhost:8891

# สำหรับ Production Server
# curl http://YOUR_SERVER_IP:8892/auth/login
# curl http://YOUR_SERVER_IP:8891
```

**ตรวจสอบ 5**: ดู Console Logs บน iPhone
1. เชื่อมต่อ iPhone กับ Mac ผ่าน USB
2. เปิด Safari บน Mac
3. ไปที่ Develop > [ชื่อ iPhone] > [URL]
4. ดู Console logs เพื่อหา error

## 📋 Checklist

ก่อนทดสอบบน iPhone ตรวจสอบว่า:

- [ ] ไฟล์ `.env.local` ถูกสร้างใน `frontend/`
- [ ] `NEXT_PUBLIC_API_URL` ตั้งค่าเป็น IP address ที่ถูกต้อง
- [ ] Frontend rebuild แล้ว (`npm run build` หรือ restart `npm run dev`)
- [ ] Backend CORS ตั้งค่าให้อนุญาต frontend IP
- [ ] Backend restart แล้ว
- [ ] Port 8891 และ 8892 เปิดอยู่
- [ ] iPhone อยู่ในเครือข่ายเดียวกันหรือสามารถเข้าถึง IP ได้

## 🎯 ตัวอย่างการตั้งค่าที่ถูกต้อง

### Development (บน localhost)

**frontend/.env.local**:
```env
NEXT_PUBLIC_API_URL=http://localhost:8892
```

**`.env` (root directory)**:
```env
FRONTEND_URL=http://localhost:8891
PORT=8892
NODE_ENV=development
DATABASE_URL=mysql://root:YOUR_PASSWORD@localhost:3306/accnextgen
JWT_SECRET=your-secret-key-change-in-production
```

### Production (บน server)

**frontend/.env.local**:
```env
NEXT_PUBLIC_API_URL=http://203.172.184.47:8892
```

**`.env` (root directory)**:
```env
FRONTEND_URL=http://YOUR_SERVER_IP:8891
PORT=8892
NODE_ENV=production
DATABASE_URL=mysql://root:YOUR_PASSWORD@localhost:3306/accnextgen
JWT_SECRET=your-very-secure-secret-key-change-in-production
```

### Production (ใช้ HTTPS)

**frontend/.env.local**:
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

**`.env` (root directory)**:
```env
FRONTEND_URL=https://yourdomain.com
PORT=8892
NODE_ENV=production
DATABASE_URL=mysql://root:YOUR_PASSWORD@localhost:3306/accnextgen
JWT_SECRET=your-very-secure-secret-key-change-in-production
```

## ⚠️ ข้อควรระวัง

1. **Environment Variables ที่ขึ้นต้นด้วย `NEXT_PUBLIC_`** จะถูก bundle เข้าไปใน JavaScript client-side ดังนั้น:
   - ห้ามใส่ secrets หรือ sensitive data
   - ค่าจะเห็นได้ใน browser console

2. **ต้อง rebuild ทุกครั้ง** ที่เปลี่ยน `.env.local` ใน production mode

3. **ตรวจสอบ CORS** ให้แน่ใจว่า backend อนุญาตให้ frontend IP/domain เข้าถึงได้

4. **ใช้ HTTPS ใน production** เพื่อความปลอดภัย

## 📞 ถ้ายังมีปัญหา

1. ตรวจสอบ Console logs (บน desktop และ mobile)
2. ตรวจสอบ Network tab ใน Developer Tools
3. ตรวจสอบ Backend logs
4. อ่านเอกสาร `MOBILE_ERROR_FIX.md` สำหรับรายละเอียดเพิ่มเติม

