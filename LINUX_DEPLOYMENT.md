# คู่มือการ Deploy บน Linux Ubuntu (Case-Sensitive Filesystem)

## 📋 การปรับปรุงสำหรับ Linux Ubuntu

ระบบได้ถูกปรับปรุงให้รองรับการทำงานบน Linux Ubuntu ที่มี case-sensitive filesystem แล้ว

### ✅ การเปลี่ยนแปลงที่ทำไปแล้ว

#### 1. Prisma Schema
- ✅ เพิ่ม `@map()` สำหรับ column names ทั้งหมดให้เป็น **snake_case** (lowercase)
  - `createdAt` → `created_at`
  - `updatedAt` → `updated_at`
  - `academicYearId` → `academic_year_id`
  - `categoryId` → `category_id`
  - `memberId` → `member_id`
  - `txnDate` → `txn_date`
  - `filePath` → `file_path`
  - `fileName` → `file_name`
  - `mimeType` → `mime_type`
  - `fileSize` → `file_size`
  - `fileHash` → `file_hash`
  - `uploadedBy` → `uploaded_by`
  - `uploadedAt` → `uploaded_at`
  - `startDate` → `start_date`
  - `endDate` → `end_date`
  - `isActive` → `is_active`
  - `passwordHash` → `password_hash`

- ✅ เพิ่ม `@db.VarChar()` และ `@db.Text()` สำหรับ string fields เพื่อกำหนดขนาดที่เหมาะสม
- ✅ Table names ใช้ **lowercase** และ **snake_case** อยู่แล้ว (`users`, `transactions`, `transaction_categories`, `academic_years`, `attachments`)

#### 2. File Paths (Attachments Service)
- ✅ Normalize upload directory path ให้เป็น absolute path
- ✅ บังคับใช้ lowercase สำหรับ directory name (`uploads`)
- ✅ Normalize filename ให้เป็น lowercase เพื่อหลีกเลี่ยงปัญหา case-sensitive
- ✅ ใช้ `path.normalize()` สำหรับ file paths ทั้งหมด
- ✅ เพิ่ม error handling สำหรับ file deletion

#### 3. Environment Variables
- ✅ ใช้ UPPERCASE naming convention (มาตรฐาน)
- ✅ Environment variables ที่ใช้:
  - `DATABASE_URL`
  - `UPLOAD_DIR`
  - `FRONTEND_URL`
  - `PORT`
  - `JWT_SECRET`
  - `NEXT_PUBLIC_API_URL`

## 🚀 วิธีการ Deploy

### 1. ตรวจสอบ MySQL Configuration

บน Linux Ubuntu, MySQL อาจมี `lower_case_table_names` ที่ต้องตั้งค่า:

```bash
# ตรวจสอบการตั้งค่าปัจจุบัน
mysql -u root -p -e "SHOW VARIABLES LIKE 'lower_case_table_names';"

# ควรเห็นค่าเป็น 1 หรือ 2
# 1 = table names จะถูกแปลงเป็น lowercase เมื่อเก็บ/ค้นหา
# 2 = table names จะถูกแปลงเป็น lowercase เมื่อเก็บ แต่ยังคง case-sensitive เมื่อค้นหา

# ถ้ายังไม่ได้ตั้งค่า ต้องแก้ใน MySQL config file
# /etc/mysql/mysql.conf.d/mysqld.cnf หรือ /etc/my.cnf
# เพิ่มบรรทัดนี้:
# lower_case_table_names = 1
```

**หมายเหตุ:** หาก MySQL table ถูกสร้างไว้แล้ว อาจต้อง migrate ใหม่

### 2. รัน Migration

```bash
# จาก root directory
cd /path/to/accnextgen

# Generate Prisma Client
npx prisma generate

# สร้าง migration สำหรับ schema changes
npx prisma migrate dev --name update_for_linux_case_sensitive

# หรือถ้าเป็น production
npx prisma migrate deploy
```

### 3. ตั้งค่า Environment Variables

สร้างไฟล์ `.env` ใน root directory:

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/school_finance?schema=public"

# Upload Directory (ใช้ absolute path หรือ relative path)
# บน Linux ควรใช้ absolute path เช่น:
UPLOAD_DIR="/var/www/accnextgen/uploads"

# Backend
PORT=8892
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
FRONTEND_URL="https://your-domain.com"

# Frontend (ตั้งใน frontend/.env.local)
NEXT_PUBLIC_API_URL="https://your-domain.com/api"
```

### 4. ตั้งค่า Upload Directory

```bash
# สร้าง directory สำหรับ uploads
sudo mkdir -p /var/www/accnextgen/uploads

# ตั้งค่า permissions (ให้ user ที่รัน application เขียนไฟล์ได้)
sudo chown -R www-data:www-data /var/www/accnextgen/uploads
sudo chmod -R 755 /var/www/accnextgen/uploads

# หรือถ้าใช้ user อื่น เช่น node:
sudo chown -R node:node /var/www/accnextgen/uploads
```

### 5. Build และ Deploy

#### Backend

```bash
cd backend
npm install
npm run build

# Production mode
npm run start:prod
```

#### Frontend

```bash
cd frontend
npm install
npm run build

# Production mode
npm run start
```

### 6. ใช้ PM2 สำหรับ Production (แนะนำ)

```bash
# ติดตั้ง PM2
npm install -g pm2

# รัน Backend
cd backend
pm2 start dist/main.js --name "accnextgen-backend"

# รัน Frontend
cd ../frontend
pm2 start .next/standalone/server.js --name "accnextgen-frontend"

# บันทึก configuration
pm2 save
pm2 startup
```

## ⚠️ ข้อควรระวัง

1. **File Paths:**
   - บน Linux ใช้ forward slash (`/`) แทน backslash (`\`)
   - File paths จะ case-sensitive (ต้องตรงกับที่บันทึกไว้ใน database)

2. **Database:**
   - ตรวจสอบว่า MySQL table names และ column names เป็น lowercase
   - ใช้ Prisma migration แทนการสร้าง table เอง

3. **Permissions:**
   - ตรวจสอบ file permissions สำหรับ upload directory
   - ตรวจสอบว่า user ที่รัน application มีสิทธิ์อ่าน/เขียนไฟล์

4. **Environment Variables:**
   - ใช้ absolute paths สำหรับ directories บน Linux
   - ตรวจสอบว่า environment variables ถูก load ถูกต้อง

## 🔍 การตรวจสอบ

หลังจาก deploy แล้ว ตรวจสอบว่า:

1. ✅ Database tables ถูกสร้างด้วย lowercase column names
2. ✅ File uploads ทำงานได้ถูกต้อง (ไฟล์ถูกเก็บใน directory ที่ถูกต้อง)
3. ✅ File paths ใน database ใช้ format ที่ถูกต้อง
4. ✅ Application สามารถอ่านไฟล์จาก paths ที่บันทึกไว้ได้

## 📝 Migration Notes

หากมีข้อมูลเดิมใน database และต้องการ migrate:

```bash
# 1. Backup database ก่อน
mysqldump -u root -p school_finance > backup.sql

# 2. รัน migration
npx prisma migrate dev --name update_for_linux_case_sensitive

# 3. ตรวจสอบว่า migration สำเร็จ
npx prisma studio
```

**คำเตือน:** Migration อาจลบข้อมูลเดิมหากมี conflict ควร backup ก่อนเสมอ

## 🐛 Troubleshooting

### ปัญหา: "Table doesn't exist" หรือ "Column doesn't exist"

**สาเหตุ:** MySQL table/column names ไม่ตรงกับที่ Prisma คาดหวัง

**วิธีแก้:**
1. ตรวจสอบว่า `lower_case_table_names = 1` ใน MySQL config
2. รัน `npx prisma migrate reset` (ระวัง: จะลบข้อมูลทั้งหมด)
3. หรือ migrate ใหม่ด้วย `npx prisma migrate dev`

### ปัญหา: "File not found" เมื่ออ่านไฟล์ที่ upload

**สาเหตุ:** File path ใน database ไม่ตรงกับ path จริงบน server

**วิธีแก้:**
1. ตรวจสอบ `UPLOAD_DIR` environment variable
2. ตรวจสอบว่า file path ใน database ใช้ absolute path หรือ relative path ถูกต้อง
3. ตรวจสอบ file permissions

### ปัญหา: "Permission denied" เมื่อ upload ไฟล์

**สาเหตุ:** User ที่รัน application ไม่มีสิทธิ์เขียนไฟล์

**วิธีแก้:**
```bash
sudo chown -R [your-user]:[your-group] /var/www/accnextgen/uploads
sudo chmod -R 755 /var/www/accnextgen/uploads
```

