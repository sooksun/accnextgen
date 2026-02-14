# คำแนะนำการรัน Migration

## สถานการณ์
Migration file ถูกสร้างแล้วและถูก mark เป็น applied แล้ว แต่ยังไม่ได้รัน SQL จริงๆ

## วิธีแก้ไข

### วิธีที่ 1: รัน SQL โดยตรงผ่าน MySQL Client (แนะนำ)

1. เปิด MySQL command line หรือใช้ MySQL Workbench
2. เชื่อมต่อกับ database `accnextgen`
3. รันไฟล์ SQL:
   ```bash
   mysql -u root -p accnextgen < prisma/migrations/20251130040627_update_for_linux_case_sensitive/migration.sql
   ```

   หรือใน MySQL command line:
   ```sql
   USE accnextgen;
   SOURCE prisma/migrations/20251130040627_update_for_linux_case_sensitive/migration.sql;
   ```

### วิธีที่ 2: แก้ไข _prisma_migrations table

1. เชื่อมต่อ MySQL:
   ```bash
   mysql -u root -p accnextgen
   ```

2. ลบ migration record:
   ```sql
   DELETE FROM _prisma_migrations 
   WHERE migration_name = '20251130040627_update_for_linux_case_sensitive';
   ```

3. รัน migration อีกครั้ง:
   ```bash
   npx prisma migrate deploy
   ```

### วิธีที่ 3: ใช้ prisma db execute (Prisma 2.19+)

```bash
npx prisma db execute --file prisma/migrations/20251130040627_update_for_linux_case_sensitive/migration.sql --schema prisma/schema.prisma
```

## หมายเหตุ

⚠️ **สำคัญ**: Migration นี้จะ rename columns ทั้งหมดจาก camelCase เป็น snake_case
- ✅ ข้อมูลทั้งหมดจะถูกเก็บไว้ (ไม่มีการลบข้อมูล)
- ✅ ใช้ `ALTER TABLE ... CHANGE COLUMN` ซึ่งปลอดภัยสำหรับข้อมูลที่มีอยู่
- ⚠️ ควร backup database ก่อนรัน migration

## ตรวจสอบหลัง Migration

หลังรัน migration แล้ว ให้ตรวจสอบว่า:
1. Columns ถูก rename เป็น snake_case แล้ว
2. Foreign keys ยังทำงานได้
3. Indexes ถูกอัพเดทแล้ว
4. Application ยังทำงานได้ปกติ

```sql
-- ตรวจสอบ columns
SHOW COLUMNS FROM users;
SHOW COLUMNS FROM transactions;
SHOW COLUMNS FROM attachments;

-- ตรวจสอบ indexes
SHOW INDEXES FROM transactions;
SHOW INDEXES FROM attachments;
```

