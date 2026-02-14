# 🔐 คู่มือ User และ Password

## 📋 มี 2 ประเภทของ User/Password

### 1. 🗄️ Database User/Password (MySQL)

**คือ**: Username และ password สำหรับเชื่อมต่อ MySQL database

**ตำแหน่งไฟล์**: `/DATA/Myapp/app/lab/accnext/.env`

**รูปแบบ**:
```env
DATABASE_URL="mysql://USERNAME:PASSWORD@localhost:3306/accnextgen"
```

#### ตัวอย่าง

```env
# ใช้ root user (default)
DATABASE_URL="mysql://root:your_mysql_root_password@localhost:3306/accnextgen"

# หรือใช้ user อื่น (แนะนำสำหรับ production)
DATABASE_URL="mysql://appuser:secure_password@localhost:3306/accnextgen"
```

#### วิธีตรวจสอบ MySQL Root Password

```bash
# ถ้าไม่รู้ root password ให้ลอง reset
sudo mysql

# หรือ
mysql -u root -p
# แล้วกรอก password ที่ตั้งไว้
```

#### วิธีสร้าง Database User ใหม่ (แนะนำสำหรับ Production)

```bash
# เข้า MySQL ด้วย root
sudo mysql -u root -p

# สร้าง user ใหม่
CREATE USER 'appuser'@'localhost' IDENTIFIED BY 'your_secure_password';

# ให้สิทธิ์ access database
GRANT ALL PRIVILEGES ON accnextgen.* TO 'appuser'@'localhost';

# Apply changes
FLUSH PRIVILEGES;

# ออกจาก MySQL
EXIT;
```

แล้วแก้ไข `.env`:
```env
DATABASE_URL="mysql://appuser:your_secure_password@localhost:3306/accnextgen"
```

---

### 2. 👤 Application User/Password (Login เข้าระบบ)

**คือ**: Username และ password สำหรับ login เข้าระบบ web application

**Default Users จาก Seed**: 
- ⚠️ **หมายเหตุ**: Users จาก seed มี `passwordHash` เป็น dummy ไม่สามารถ login ได้จริง

#### วิธีสร้าง User ใหม่ผ่าน API

```bash
# Register user ใหม่
curl -X POST http://localhost:8892/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ผู้ดูแลระบบ",
    "email": "admin@school.ac.th",
    "password": "your_password_here",
    "role": "ADMIN"
  }'
```

#### วิธี Login

**Frontend**: ไปที่ `http://localhost:8891` แล้ว login ผ่านหน้าเว็บ

**API**:
```bash
curl -X POST http://localhost:8892/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@school.ac.th",
    "password": "your_password_here"
  }'
```

#### Default Users จาก Seed (แต่ต้อง Register ใหม่)

| Email | Role | หมายเหตุ |
|-------|------|----------|
| `admin@school.ac.th` | ADMIN | ผู้ดูแลระบบ |
| `finance@school.ac.th` | FINANCE | เจ้าหน้าที่การเงิน |
| `teacher@school.ac.th` | TEACHER | ครู |
| `staff@school.ac.th` | STAFF | เจ้าหน้าที่ทั่วไป |

⚠️ **สำคัญ**: Users เหล่านี้ต้อง register ใหม่ผ่าน API หรือหน้าเว็บ เพราะ password ใน seed เป็น dummy hash

---

## 🔧 วิธีตั้งค่า Database Password

### Step 1: ตรวจสอบ MySQL Root Password

```bash
# ทดสอบ login
mysql -u root -p
```

### Step 2: สร้างไฟล์ .env

```bash
cd /DATA/Myapp/app/lab/accnext

# สร้างไฟล์ .env
nano .env
```

### Step 3: ใส่ DATABASE_URL

```env
# แทนที่ YOUR_PASSWORD ด้วย MySQL root password ของคุณ
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/accnextgen"

FRONTEND_URL=http://localhost:8891
PORT=8892
NODE_ENV=production
JWT_SECRET=your-secret-key-change-in-production
```

### Step 4: ทดสอบการเชื่อมต่อ

```bash
# Generate Prisma Client
cd /DATA/Myapp/app/lab/accnext
npx prisma generate --schema=prisma/schema.prisma

# ทดสอบ connection
npx prisma db pull --schema=prisma/schema.prisma
```

---

## 📝 สรุป

### Database (MySQL)
- **User**: `root` (default) หรือ user อื่นที่สร้าง
- **Password**: Password ที่ตั้งไว้ตอนติดตั้ง MySQL
- **ตั้งค่าใน**: `/DATA/Myapp/app/lab/accnext/.env` → `DATABASE_URL`

### Application (Login)
- **Email**: ต้อง register ใหม่ผ่าน API หรือหน้าเว็บ
- **Password**: ตั้งได้เองตอน register
- **ไม่มี default password** ที่ใช้ได้ (ต้อง register ใหม่)

---

## ✅ Checklist

ก่อนใช้งานระบบ ตรวจสอบว่า:

- [ ] MySQL root password รู้แล้ว
- [ ] ไฟล์ `.env` ตั้งค่า `DATABASE_URL` ถูกต้อง
- [ ] ทดสอบ database connection ได้ (`npx prisma db pull`)
- [ ] Register user ใหม่สำหรับ login (ถ้ายังไม่มี)
- [ ] Login เข้าระบบได้

---

## 🆘 ถ้าลืม Password

### MySQL Root Password

```bash
# Reset MySQL root password
sudo systemctl stop mysql
sudo mysqld_safe --skip-grant-tables &
mysql -u root
USE mysql;
UPDATE user SET authentication_string=PASSWORD('new_password') WHERE User='root';
FLUSH PRIVILEGES;
EXIT;
sudo systemctl start mysql
```

### Application User Password

- **สำหรับ Admin**: ใช้ API `/users/:id/password` เพื่อเปลี่ยน password (ต้องมี admin token)
- **สำหรับ User เอง**: ใช้หน้าเว็บ "เปลี่ยนรหัสผ่าน" (ถ้ามี) หรือติดต่อ Admin

