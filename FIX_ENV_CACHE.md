# 🔧 แก้ไขปัญหา Environment Variable Cache

## ❌ ปัญหา

แม้ว่าแก้ไขไฟล์ `.env.local` แล้ว แต่ Next.js ยังใช้ค่าเก่า `203.172.184.47:8892`

## 🔍 สาเหตุ

Next.js cache environment variables ตอน build time หรือ runtime

## ✅ วิธีแก้ไข

### วิธีที่ 1: ลบ .next folder และ rebuild (แนะนำ)

```bash
cd frontend

# ลบ cache
rm -rf .next
# หรือ Windows PowerShell
Remove-Item -Recurse -Force .next

# Restart dev server
npm run dev
```

### วิธีที่ 2: Hard Refresh Browser

1. กด `Ctrl + Shift + R` (Windows/Linux)
2. หรือ `Cmd + Shift + R` (Mac)
3. หรือ Clear Browser Cache

### วิธีที่ 3: ตรวจสอบและแก้ไขไฟล์ .env.local

```bash
cd frontend

# ตรวจสอบเนื้อหา
cat .env.local
# หรือ Windows PowerShell
Get-Content .env.local

# ควรเห็น:
# NEXT_PUBLIC_API_URL=http://localhost:8892
```

ถ้ายังไม่ถูกต้อง แก้ไข:

```bash
# Windows PowerShell
echo "NEXT_PUBLIC_API_URL=http://localhost:8892" | Out-File -FilePath .env.local -Encoding utf8

# หรือ Linux/Mac
echo "NEXT_PUBLIC_API_URL=http://localhost:8892" > .env.local
```

### วิธีที่ 4: Restart Dev Server ใหม่

1. **หยุด dev server** (กด Ctrl+C)
2. **ลบ .next folder**:
   ```bash
   cd frontend
   rm -rf .next
   ```
3. **Start ใหม่**:
   ```bash
   npm run dev
   ```

---

## 📋 Checklist

- [ ] ไฟล์ `frontend/.env.local` มี `NEXT_PUBLIC_API_URL=http://localhost:8892`
- [ ] ลบ `.next` folder แล้ว
- [ ] Restart dev server ใหม่
- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] ตรวจสอบ Browser Console ว่า API calls ไปที่ `http://localhost:8892`

---

## 🧪 ตรวจสอบว่าทำงานถูกต้อง

1. **เปิด Browser Console** (F12)
2. **ไปที่ Network tab**
3. **ทำการ register หรือ login**
4. **ตรวจสอบ Request URL** - ควรเป็น `http://localhost:8892/auth/register` หรือ `http://localhost:8892/auth/login`
5. **ไม่ควรเห็น** `203.172.184.47` ใน URL

---

## ⚠️ หมายเหตุ

- Next.js อ่าน `NEXT_PUBLIC_*` environment variables **ตอน build time** สำหรับ production build
- สำหรับ **development mode** (`npm run dev`) จะอ่านค่าใหม่ทุกครั้งที่ restart
- ถ้าใช้ **production mode** (`npm run build` + `npm run start`) ต้อง rebuild ใหม่ทุกครั้งที่เปลี่ยน `.env.local`

