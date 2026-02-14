# Swagger API Documentation

## 📚 API Documentation ได้ถูกเพิ่มเข้าไปในระบบแล้ว!

### การเข้าถึง

เมื่อ backend server รันอยู่ สามารถเข้าถึง API Documentation ได้ที่:

```
http://localhost:8892/api-docs
```

### คุณสมบัติ

1. **Interactive API Documentation**
   - ทดสอบ API endpoints ได้โดยตรงจาก browser
   - ดู request/response schemas
   - ทดสอบ authentication และ authorization

2. **Complete Endpoint Documentation**
   - ✅ Authentication endpoints (login, register, profile)
   - ✅ User management endpoints (CRUD + role-based)
   - ✅ Transaction endpoints (CRUD, summary, boards)
   - ✅ Category endpoints
   - ✅ Academic year endpoints
   - ✅ Attachment endpoints

3. **Request/Response Examples**
   - ทุก endpoint มีตัวอย่าง request และ response
   - มี descriptions และ parameter explanations

4. **Authentication Support**
   - สามารถใส่ JWT token ใน Swagger UI
   - Token จะถูกเก็บไว้ (persistAuthorization)
   - ทดสอบ protected endpoints ได้ง่าย

### การใช้งาน

1. **เปิด Swagger UI**
   ```
   http://localhost:8892/api-docs
   ```

2. **Login เพื่อรับ Token**
   - ไปที่ `POST /auth/login`
   - ใส่ email และ password
   - กด "Try it out" แล้ว "Execute"
   - Copy `access_token` จาก response

3. **Authorize Token**
   - กดปุ่ม "Authorize" ที่ด้านบนขวา
   - ใส่ token ในรูปแบบ: `Bearer <token>`
   - กด "Authorize" แล้ว "Close"

4. **ทดสอบ API**
   - ทุก endpoint ที่ต้องการ authentication จะใช้ token อัตโนมัติ
   - สามารถทดสอบได้ทันที

### Tags ที่มี

- **auth** - Authentication endpoints
- **users** - User management
- **transactions** - Transaction management
- **categories** - Category management
- **academic-years** - Academic year management
- **attachments** - File attachment management

### Security Features

- ✅ JWT Bearer Authentication
- ✅ Role-based access control documentation
- ✅ Input validation documentation
- ✅ Error responses documentation

### Tips

- ใช้ **Try it out** เพื่อทดสอบ API ได้เลย
- Response จะแสดงตัวอย่างข้อมูลจริง
- ดู Schema เพื่อเข้าใจ data structure
- ตรวจสอบ Error responses สำหรับ error handling

## 📝 Notes

- Swagger UI จะทำงานในทุก environment (development, production)
- ใน production อาจต้องการ disable หรือ restrict access
- Documentation จะอัพเดทอัตโนมัติเมื่อแก้ไข controllers/DTOs

