# การตั้งค่า Deploy บน Server (Node.js Selector / Passenger)

แทนที่ `solutio9` ด้วย username จริงของคุณบนเซิร์ฟเวอร์

---

## 1. Application root

**ความหมาย:** path โฟลเดอร์บนเซิร์ฟเวอร์ที่คุณอัปโหลดไฟล์โปรเจกต์ (มี `package.json`, โฟลเดอร์ `.next` หลัง build)

**ตัวอย่าง:**
```text
/home/solutio9/accnextgen
```
หรือถ้าใช้ subdomain / โฟลเดอร์ตามโดเมน:
```text
/home/solutio9/domains/solution-nextgen.co.th/accnextgen
```

**วิธีใช้:** สร้างโฟลเดอร์นี้ใน File Manager แล้วอัปโหลดไฟล์โปรเจกต์ทั้งหมด (หลังรัน `npm run build` แล้ว) ไปที่ path นี้ แล้วใส่ path นี้ลงในช่อง Application root

---

## 2. Application URL

**ความหมาย:** โดเมนหรือ subdomain ที่จะเข้าใช้แอป (ลิงก์ HTTP/HTTPS)

**ตัวอย่าง:**
- ใช้โดเมนหลัก: `solution-nextgen.co.th`
- ใช้ subdomain: `app.solution-nextgen.co.th` หรือ `acc.solution-nextgen.co.th`

**วิธีใช้:** ใส่โดเมนที่ชี้มาที่แอปนี้ (ต้องตั้ง DNS / subdomain ไว้แล้ว)

---

## 3. Application startup file

**ความหมาย:** ไฟล์หรือคำสั่งที่ใช้สตาร์ทแอป (จุดเข้าแอป Node.js)

**แบบที่ 1 – ใช้ไฟล์ `server.js` (แนะนำ)**  
ใส่ path เทียบจาก Application root:
```text
server.js
```
หรือ path เต็ม:
```text
/home/solutio9/accnextgen/server.js
```

**แบบที่ 2 – ถ้า panel ให้ใส่คำสั่งแทน path ไฟล์**  
ใช้คำสั่ง:
```text
node server.js
```
หรือ:
```text
node node_modules/next/dist/bin/next start
```

โปรเจกต์นี้มีไฟล์ `server.js` อยู่ที่ root ใช้สำหรับโฮสต์ที่ต้องชี้ไปที่ไฟล์สตาร์ทโดยตรง

---

## 4. Passenger log file

**ความหมาย:** path ไฟล์ที่ Passenger จะเขียน log (ใช้ดู error / การรันแอป)

**ตัวอย่าง:**
```text
/home/solutio9/logs/passenger.log
```

**วิธีใช้:** ใช้ path ตามที่โฮสต์กำหนด หรือสร้างโฟลเดอร์ `logs` ใน home แล้วตั้งเป็น `~/logs/passenger.log`

---

## สรุปค่าที่ใส่ในฟอร์ม

| ช่อง | ค่าที่ใส่ |
|------|-----------|
| **Application root** | `/home/solutio9/accnextgen` (หรือ path จริงที่คุณอัปโหลดโปรเจกต์) |
| **Application URL** | `solution-nextgen.co.th` หรือ subdomain ที่ใช้ |
| **Application startup file** | `server.js` หรือ `/home/solutio9/accnextgen/server.js` |
| **Passenger log file** | `/home/solutio9/logs/passenger.log` |

---

## ขั้นตอนก่อน Deploy

1. บนเครื่องตัวเอง: `npm run build`
2. อัปโหลดทั้งโปรเจกต์ (รวม `.next`, `node_modules`, `server.js`, `package.json` ฯลฯ) ไปที่โฟลเดอร์ที่ใช้เป็น Application root
3. บนเซิร์ฟเวอร์ (ในโฟลเดอร์นั้น): รัน `npm install --production` ถ้าต้องการติดตั้ง dependencies ใหม่บนเซิร์ฟเวอร์
4. ตั้ง Environment variables (เช่น `DATABASE_URL`, `NODE_ENV=production`) ใน panel
5. บันทึกการตั้งค่าแล้วเปิดแอป / รีสตาร์ท

ถ้า error ดูที่ Passenger log file ที่ตั้งไว้
