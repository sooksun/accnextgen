# 🔧 แก้ไขปัญหา Database Connection Error

## ❌ ปัญหา

```
PrismaClientInitializationError: Authentication failed against database server at `localhost`, 
the provided database credentials for `root` are not valid.
```

## 🔍 สาเหตุ

1. **DATABASE_URL ไม่ถูกตั้งค่า** หรือตั้งค่าผิด
2. **Backend อ่าน `.env` จาก root directory** (`../.env`) ไม่ใช่ `backend/.env`
3. **Database credentials ไม่ถูกต้อง**

## ✅ วิธีแก้ไข

### ขั้นตอนที่ 1: ตรวจสอบตำแหน่งไฟล์ .env

จาก `backend/src/app.module.ts`:
```typescript
ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: path.resolve(process.cwd(), '../.env'), // อ่านจาก root directory
})
```

**หมายเหตุ**: Backend อ่าน `.env` จาก **root directory** (`/DATA/Myapp/app/lab/accnext/.env`) ไม่ใช่ `backend/.env`

### ขั้นตอนที่ 2: สร้างหรือแก้ไขไฟล์ .env ที่ root directory

```bash
cd /DATA/Myapp/app/lab/accnext

# สร้างหรือแก้ไขไฟล์ .env
nano .env
# หรือ
vi .env
```

เพิ่มหรือแก้ไข:

```env
# Database URL
# รูปแบบ: mysql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/accnextgen"

# Frontend URL สำหรับ CORS
FRONTEND_URL=http://localhost:8891

# Backend Port
PORT=8892

# JWT Secret (ตั้งค่าให้ปลอดภัย)
JWT_SECRET=your-very-secure-secret-key-change-in-production

# Environment
NODE_ENV=production

# Upload Directory (optional)
UPLOAD_DIR=./uploads
```

### ขั้นตอนที่ 3: ตรวจสอบ Database

```bash
# ทดสอบการเชื่อมต่อ MySQL
mysql -h localhost -u root -p

# ตรวจสอบว่า database ถูกสร้างแล้ว
mysql -u root -p -e "SHOW DATABASES;"

# ถ้ายังไม่มี database ให้สร้าง:
mysql -u root -p -e "CREATE DATABASE accnextgen CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### ขั้นตอนที่ 4: Generate Prisma Client

```bash
cd /DATA/Myapp/app/lab/accnext

# Generate Prisma Client
npx prisma generate --schema=prisma/schema.prisma
```

### ขั้นตอนที่ 5: ทดสอบการเชื่อมต่อ

```bash
cd /DATA/Myapp/app/lab/accnext

# ทดสอบ Prisma connection
npx prisma db pull --schema=prisma/schema.prisma
```

### ขั้นตอนที่ 6: Restart Backend

```bash
cd /DATA/Myapp/app/lab/accnext/backend

# Build
npm run build

# Start
npm run start:prod
```

## 📋 ตัวอย่าง DATABASE_URL

### MySQL Local (default)
```env
DATABASE_URL="mysql://root:password123@localhost:3306/accnextgen"
```

### MySQL Remote
```env
DATABASE_URL="mysql://username:password@localhost:3306/accnextgen"
```

### MySQL with specific charset
```env
DATABASE_URL="mysql://root:password@localhost:3306/accnextgen?charset=utf8mb4"
```

## ⚠️ ข้อควรระวัง

1. **อย่า commit `.env` file** เข้า git
2. ใช้ **strong password** สำหรับ database
3. ใน production ควรใช้ **separate database user** แทน root
4. ตรวจสอบว่า **firewall** อนุญาตให้เข้าถึง database port (3306)

## 🔍 Troubleshooting

### ปัญหา: Access Denied

**วิธีแก้**:
```bash
# ตรวจสอบ MySQL user
mysql -u root -p -e "SELECT user, host FROM mysql.user;"

# สร้าง user ใหม่ (ถ้าจำเป็น)
mysql -u root -p -e "CREATE USER 'appuser'@'localhost' IDENTIFIED BY 'password';"
mysql -u root -p -e "GRANT ALL PRIVILEGES ON accnextgen.* TO 'appuser'@'localhost';"
mysql -u root -p -e "FLUSH PRIVILEGES;"
```

### ปัญหา: Can't connect to MySQL server

**วิธีแก้**:
```bash
# ตรวจสอบว่า MySQL ทำงานอยู่
sudo systemctl status mysql

# Start MySQL
sudo systemctl start mysql

# Enable MySQL on boot
sudo systemctl enable mysql
```

### ปัญหา: Unknown database

**วิธีแก้**:
```sql
CREATE DATABASE accnextgen CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## ✅ Checklist

ก่อน start backend ตรวจสอบว่า:

- [ ] MySQL server ทำงานอยู่ (`sudo systemctl status mysql`)
- [ ] Database `accnextgen` ถูกสร้างแล้ว
- [ ] ไฟล์ `.env` อยู่ที่ root directory (`/DATA/Myapp/app/lab/accnext/.env`)
- [ ] `DATABASE_URL` ตั้งค่าถูกต้องใน `.env`
- [ ] Username และ password ถูกต้อง
- [ ] User มีสิทธิ์เข้าถึง database
- [ ] Prisma Client ถูก generate แล้ว (`npx prisma generate`)
- [ ] ทดสอบการเชื่อมต่อได้ (`npx prisma db pull`)

## 📝 ตัวอย่างไฟล์ .env ที่สมบูรณ์ (root directory)

```env
# ============================================
# Database Configuration
# ============================================
DATABASE_URL="mysql://root:your_password@localhost:3306/accnextgen"

# ============================================
# Application Configuration
# ============================================
FRONTEND_URL=http://localhost:8891
PORT=8892
NODE_ENV=production

# ============================================
# Security
# ============================================
JWT_SECRET=your-very-secure-secret-key-change-in-production-min-32-chars

# ============================================
# Optional
# ============================================
UPLOAD_DIR=./uploads
```

## 🚀 Quick Fix Command

```bash
# 1. ไปที่ root directory
cd /DATA/Myapp/app/lab/accnext

# 2. สร้างไฟล์ .env (แก้ไข password ให้ถูกต้อง)
cat > .env << 'EOF'
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/accnextgen"
FRONTEND_URL=http://localhost:8891
PORT=8892
NODE_ENV=production
JWT_SECRET=your-secret-key-change-in-production
EOF

# 3. Generate Prisma Client
npx prisma generate --schema=prisma/schema.prisma

# 4. Build และ Start Backend
cd backend
npm run build
npm run start:prod
```


