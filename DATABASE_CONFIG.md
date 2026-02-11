# 🗄️ แก้ไขปัญหา Database Connection

## ปัญหา

```
PrismaClientInitializationError: Authentication failed against database server at `localhost`, 
the provided database credentials for `root` are not valid.
```

## สาเหตุ

1. **DATABASE_URL ไม่ถูกตั้งค่า** หรือตั้งค่าผิด
2. **Database credentials ไม่ถูกต้อง** (username/password)
3. **Database server ไม่ได้รันอยู่** หรือไม่สามารถเข้าถึงได้

## วิธีแก้ไข

### ขั้นตอนที่ 1: ตรวจสอบ Database Configuration

ตรวจสอบว่า database server ทำงานอยู่และสามารถเข้าถึงได้:

```bash
# ทดสอบการเชื่อมต่อ MySQL
mysql -h localhost -u root -p
```

### ขั้นตอนที่ 2: ตั้งค่า DATABASE_URL ใน backend/.env

สร้างหรือแก้ไขไฟล์ `backend/.env`:

```bash
cd /DATA/Myapp/app/lab/accnext/backend
```

เพิ่มหรือแก้ไข `DATABASE_URL`:

```env
# MySQL Database URL
# รูปแบบ: mysql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/accnextgen"

# หรือถ้าใช้ database server อื่น
# DATABASE_URL="mysql://username:password@203.172.184.47:3306/accnextgen"

# Frontend URL สำหรับ CORS
FRONTEND_URL=http://203.172.184.47:8891

# Backend Port
PORT=8892

# JWT Secret
JWT_SECRET=your-secret-key-change-in-production

# Environment
NODE_ENV=production
```

### ขั้นตอนที่ 3: ตรวจสอบ Database Name

ตรวจสอบว่า database name ถูกต้อง:

```bash
# เข้า MySQL
mysql -u root -p

# ดู databases ทั้งหมด
SHOW DATABASES;

# ตรวจสอบว่า database ถูกสร้างแล้ว
# ถ้ายังไม่มี ให้สร้าง:
CREATE DATABASE accnextgen CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### ขั้นตอนที่ 4: ตรวจสอบ Prisma Schema

ตรวจสอบไฟล์ `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

### ขั้นตอนที่ 5: Generate Prisma Client

```bash
cd /DATA/Myapp/app/lab/accnext

# Generate Prisma Client
npx prisma generate --schema=prisma/schema.prisma
```

### ขั้นตอนที่ 6: ทดสอบการเชื่อมต่อ

```bash
cd /DATA/Myapp/app/lab/accnext/backend

# ทดสอบ Prisma connection
npx prisma db pull --schema=../prisma/schema.prisma
```

### ขั้นตอนที่ 7: Restart Backend

```bash
cd /DATA/Myapp/app/lab/accnext/backend

# Build
npm run build

# Start
npm run start:prod
```

## ตัวอย่าง DATABASE_URL

### MySQL Local
```env
DATABASE_URL="mysql://root:password123@localhost:3306/accnextgen"
```

### MySQL Remote
```env
DATABASE_URL="mysql://username:password@203.172.184.47:3306/accnextgen"
```

### MySQL with SSL
```env
DATABASE_URL="mysql://username:password@host:3306/database?sslmode=require"
```

## Troubleshooting

### ปัญหา: Access Denied

**สาเหตุ**: Username หรือ password ไม่ถูกต้อง

**วิธีแก้**:
1. ตรวจสอบ username และ password
2. ตรวจสอบว่า user มีสิทธิ์เข้าถึง database
3. ทดสอบด้วย MySQL client ก่อน

### ปัญหา: Can't connect to MySQL server

**สาเหตุ**: Database server ไม่ทำงานหรือไม่สามารถเข้าถึงได้

**วิธีแก้**:
```bash
# ตรวจสอบว่า MySQL ทำงานอยู่
sudo systemctl status mysql
# หรือ
sudo service mysql status

# Start MySQL ถ้ายังไม่ทำงาน
sudo systemctl start mysql
```

### ปัญหา: Unknown database

**สาเหตุ**: Database ยังไม่ได้สร้าง

**วิธีแก้**:
```sql
CREATE DATABASE accnextgen CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### ปัญหา: Prisma Client not generated

**สาเหตุ**: ยังไม่ได้รัน `prisma generate`

**วิธีแก้**:
```bash
cd /DATA/Myapp/app/lab/accnext
npx prisma generate --schema=prisma/schema.prisma
```

## Checklist

ก่อน start backend ตรวจสอบว่า:

- [ ] MySQL server ทำงานอยู่
- [ ] Database ถูกสร้างแล้ว
- [ ] `backend/.env` มี `DATABASE_URL` ที่ถูกต้อง
- [ ] Username และ password ถูกต้อง
- [ ] User มีสิทธิ์เข้าถึง database
- [ ] Prisma Client ถูก generate แล้ว (`npx prisma generate`)
- [ ] ทดสอบการเชื่อมต่อได้ (`npx prisma db pull`)

## ตัวอย่างไฟล์ backend/.env ที่สมบูรณ์

```env
# Database
DATABASE_URL="mysql://root:your_password@localhost:3306/accnextgen"

# Frontend URL สำหรับ CORS
FRONTEND_URL=http://203.172.184.47:8891

# Backend Port
PORT=8892

# JWT Secret (ตั้งค่าให้ปลอดภัย)
JWT_SECRET=your-very-secure-secret-key-change-in-production

# Environment
NODE_ENV=production

# Upload Directory (optional)
UPLOAD_DIR=./uploads
```

## หมายเหตุ

- **อย่า commit `.env` file** เข้า git
- ใช้ **strong password** สำหรับ database
- ใน production ควรใช้ **separate database user** แทน root
- ตรวจสอบว่า **firewall** อนุญาตให้เข้าถึง database port (3306)


