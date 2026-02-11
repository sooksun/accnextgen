# 🔧 แก้ไขปัญหา: Cannot find module '@nestjs/swagger'

## ปัญหา

เมื่อ build backend พบ error:
```
error TS2307: Cannot find module '@nestjs/swagger' or its corresponding type declarations.
```

## สาเหตุ

Package `@nestjs/swagger` ยังไม่ได้ติดตั้งใน backend

## วิธีแก้ไข

### ขั้นตอนที่ 1: ติดตั้ง Package

```bash
cd /DATA/Myapp/app/lab/accnext/backend
npm install --save @nestjs/swagger
```

### ขั้นตอนที่ 2: ตรวจสอบการติดตั้ง

```bash
# ตรวจสอบว่า package ถูกติดตั้งแล้ว
npm list @nestjs/swagger
```

### ขั้นตอนที่ 3: Build ใหม่

```bash
npm run build
```

## ถ้ายังมีปัญหา

### ตรวจสอบ package.json

ตรวจสอบว่า `package.json` มี `@nestjs/swagger` ใน dependencies:

```json
{
  "dependencies": {
    "@nestjs/swagger": "^11.2.3",
    ...
  }
}
```

### ลบ node_modules และติดตั้งใหม่

```bash
# ลบ node_modules และ package-lock.json
rm -rf node_modules package-lock.json

# ติดตั้งใหม่
npm install

# Build
npm run build
```

### ตรวจสอบ Version

ตรวจสอบว่าใช้ Next.js version ที่ compatible:

```bash
# ตรวจสอบ version
npm list @nestjs/core @nestjs/common
```

## หมายเหตุ

- ควรใช้ `npm install --save` แทน `npm install --save-dev` เพราะ Swagger ถูกใช้ใน production code
- หากใช้ yarn แทน npm: `yarn add @nestjs/swagger`


