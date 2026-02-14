# 🔧 แก้ไขปัญหา Error บน iPhone/Mobile

## ปัญหาที่พบ

เมื่อเข้าใช้งานระบบบน iPhone หรือ mobile device อาจพบ error:
```
Application error: a client-side exception has occurred
```

## สาเหตุหลัก

1. **API URL Configuration**: ระบบยังใช้ `localhost` ซึ่งไม่สามารถเข้าถึงได้จาก mobile device
2. **ไม่มี Error Boundary**: ไม่มีการจัดการ client-side errors
3. **CORS/Mixed Content**: อาจมีปัญหาเรื่อง HTTPS/HTTP

## วิธีแก้ไข

### 1. ตั้งค่า API URL สำหรับ Production

#### ขั้นตอนที่ 1: สร้างไฟล์ `.env.local` ในโฟลเดอร์ `frontend/`

```bash
cd frontend
```

สร้างไฟล์ `.env.local` และเพิ่ม:

```env
# สำหรับ Localhost (Development)
NEXT_PUBLIC_API_URL=http://localhost:8892

# สำหรับ Production Server
# NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP:8892
```

**หมายเหตุ**: 
- สำหรับ **Development**: ใช้ `http://localhost:8892`
- สำหรับ **Production**: แทนที่ `YOUR_SERVER_IP` ด้วย IP address ของ backend server

#### ขั้นตอนที่ 2: Rebuild และ Restart

```bash
# Build ใหม่
npm run build

# หรือถ้าใช้ dev mode
npm run dev
```

### 2. ตรวจสอบ Backend CORS Configuration

ตรวจสอบว่า backend อนุญาตให้ frontend IP/domain เข้าถึงได้:

**ไฟล์**: `backend/src/main.ts`

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8891',
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})
```

**ตั้งค่า environment variable** ใน backend:

```env
# สำหรับ Localhost (Development)
FRONTEND_URL=http://localhost:8891

# สำหรับ Production Server
# FRONTEND_URL=http://YOUR_SERVER_IP:8891
```

**หมายเหตุ**: Backend อ่าน `.env` จาก **root directory** ไม่ใช่ `backend/.env`

### 3. ตรวจสอบ Network Access

**บน iPhone/Mobile**:

1. ตรวจสอบว่า mobile device อยู่ในเครือข่ายเดียวกันกับ server หรือ
2. ตรวจสอบว่า firewall อนุญาตให้เข้าถึง port 8891 (frontend) และ 8892 (backend)

### 4. ตรวจสอบ Browser Console

**บน iPhone Safari**:

1. เชื่อมต่อ iPhone กับ Mac ผ่าน USB
2. เปิด Safari บน Mac
3. ไปที่ Develop > [ชื่อ iPhone] > [URL]
4. ดู Console logs เพื่อดู error ที่แท้จริง

### 5. ใช้ Error Boundary

ระบบได้เพิ่ม Error Boundary component แล้ว เพื่อจับและแสดง error แบบ user-friendly

## การทดสอบ

### ทดสอบบน Desktop ก่อน

1. เปิด browser ที่ desktop
2. เข้าไปที่ `http://localhost:8891` (สำหรับ localhost) หรือ `http://YOUR_SERVER_IP:8891` (สำหรับ production)
3. ตรวจสอบว่าใช้งานได้ปกติ

### ทดสอบบน Mobile

1. เปิด browser บน iPhone
2. เข้าไปที่ `http://YOUR_SERVER_IP:8891` (ต้องใช้ IP address สำหรับ mobile device)
3. ตรวจสอบ Console (ถ้าเป็นไปได้)

**หมายเหตุ**: สำหรับ mobile device ไม่สามารถใช้ `localhost` ได้ ต้องใช้ IP address ของ server

## Troubleshooting

### ถ้ายังมีปัญหา

1. **ตรวจสอบ Network**
   ```bash
   # ทดสอบว่า backend ทำงานอยู่
   # สำหรับ Localhost
   curl http://localhost:8892/auth/login
   
   # สำหรับ Production Server
   # curl http://YOUR_SERVER_IP:8892/auth/login
   ```

2. **ตรวจสอบ Firewall**
   ```bash
   # Ubuntu
   sudo ufw status
   sudo ufw allow 8891
   sudo ufw allow 8892
   ```

3. **ตรวจสอบ Next.js Build**
   ```bash
   cd frontend
   npm run build
   # ดูว่ามี error หรือไม่
   ```

4. **Clear Cache**
   - ลบ `.next` folder
   - ลบ `node_modules` และ reinstall
   ```bash
   cd frontend
   rm -rf .next node_modules
   npm install
   npm run build
   ```

## Configuration สำหรับ Production

### แนะนำให้ใช้ HTTPS

สำหรับ production ควรใช้ HTTPS เพื่อความปลอดภัย:

1. **Setup SSL Certificate** (Let's Encrypt)
2. **Update API URL**:
   ```env
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com
   ```
3. **Update CORS**:
   ```typescript
   origin: 'https://yourdomain.com'
   ```

### ใช้ Reverse Proxy (Nginx)

```nginx
# Frontend
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:8891;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:8892;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## ตรวจสอบความเรียบร้อย

✅ API URL ตั้งค่าถูกต้องใน `.env.local`  
✅ Backend CORS อนุญาต frontend URL  
✅ Port 8891 และ 8892 เปิดอยู่  
✅ Frontend build สำเร็จ  
✅ Error Boundary ทำงาน  
✅ ไม่มี error ใน Console  

## ติดต่อ

หากยังมีปัญหา:
1. ตรวจสอบ Console logs
2. ตรวจสอบ Network tab ใน Developer Tools
3. ตรวจสอบ Backend logs

