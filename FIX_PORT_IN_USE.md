# 🔧 แก้ไขปัญหา: Port 8892 ถูกใช้งานอยู่แล้ว

## ❌ ปัญหา

```
Error: listen EADDRINUSE: address already in use :::8892
```

## 🔍 สาเหตุ

Port 8892 ถูกใช้งานโดย process อื่นอยู่แล้ว (อาจเป็น backend process เก่าที่ยังรันอยู่)

## ✅ วิธีแก้ไข

### วิธีที่ 1: หาและ Kill Process ที่ใช้ Port 8892

```bash
# หา process ที่ใช้ port 8892
sudo lsof -i :8892
# หรือ
sudo netstat -tulpn | grep 8892
# หรือ
sudo ss -tulpn | grep 8892

# Kill process (แทนที่ PID ด้วย process ID ที่พบ)
sudo kill -9 <PID>

# หรือ kill ทั้งหมดที่ใช้ port 8892
sudo fuser -k 8892/tcp
```

### วิธีที่ 2: ใช้ pkill หรือ killall

```bash
# หา node processes
ps aux | grep node

# Kill node process ทั้งหมด (ระวัง: จะ kill node processes ทั้งหมด)
pkill -f node

# หรือ kill เฉพาะ backend process
pkill -f "nest start"
```

### วิธีที่ 3: หาและ Kill ด้วย PID

```bash
# หา PID ของ process ที่ใช้ port 8892
lsof -ti:8892

# Kill process
kill -9 $(lsof -ti:8892)

# หรือถ้าต้องการใช้ sudo
sudo kill -9 $(sudo lsof -ti:8892)
```

## 🚀 Quick Fix Command

```bash
# หาและ kill process ที่ใช้ port 8892
sudo kill -9 $(sudo lsof -ti:8892)

# จากนั้น start backend ใหม่
cd /DATA/Myapp/app/lab/accnext/backend
npm run start:prod
```

## 📋 ขั้นตอนที่แนะนำ

### 1. ตรวจสอบว่า port 8892 ถูกใช้งานอยู่หรือไม่

```bash
sudo lsof -i :8892
```

### 2. ถ้าพบ process ที่ใช้ port นี้ ให้ kill

```bash
# ใช้ PID ที่พบจากคำสั่งก่อนหน้า
sudo kill -9 <PID>
```

### 3. Start backend ใหม่

```bash
cd /DATA/Myapp/app/lab/accnext/backend
npm run start:prod
```

## 💡 ใช้ Process Manager (แนะนำสำหรับ Production)

### ใช้ PM2

```bash
# ติดตั้ง PM2
npm install -g pm2

# Start backend ด้วย PM2
cd /DATA/Myapp/app/lab/accnext/backend
pm2 start dist/main.js --name backend

# ดู status
pm2 status

# Stop
pm2 stop backend

# Restart
pm2 restart backend

# ดู logs
pm2 logs backend
```

### ใช้ systemd (สำหรับ Linux service)

สร้างไฟล์ `/etc/systemd/system/backend.service`:

```ini
[Unit]
Description=AccNextGen Backend API
After=network.target

[Service]
Type=simple
User=payaprai
WorkingDirectory=/DATA/Myapp/app/lab/accnext/backend
ExecStart=/usr/bin/node dist/main.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
# Reload systemd
sudo systemctl daemon-reload

# Start service
sudo systemctl start backend

# Enable auto-start on boot
sudo systemctl enable backend

# Check status
sudo systemctl status backend
```

## ⚠️ หมายเหตุ

- **อย่า kill process ที่ไม่รู้จัก** เพราะอาจเป็น process สำคัญของ system
- **ตรวจสอบก่อน kill** ว่าจริงๆ เป็น backend process ของเรา
- **ใช้ PM2 หรือ systemd** สำหรับ production เพื่อจัดการ process ได้ดีกว่า

## 🔄 ถ้ายังมีปัญหา

```bash
# ตรวจสอบว่า port ถูกใช้งานจริงหรือไม่
netstat -tulpn | grep 8892

# ลองเปลี่ยน port ชั่วคราว (แก้ไข PORT ใน .env)
# หรือ restart server
sudo reboot
```


