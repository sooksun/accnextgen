import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security: เพิ่ม body size limit เพื่อรองรับ base64 image ที่ส่งมาจาก frontend
  // Default limit คือ 100KB แต่เราต้องการรองรับไฟล์รูปภาพที่ encode เป็น base64
  app.use(json({ limit: '10mb' })); // เพิ่ม limit เป็น 10MB สำหรับ JSON body
  app.use(urlencoded({ extended: true, limit: '10mb' })); // เพิ่ม limit สำหรับ URL-encoded body

  // Security: Enable CORS for Frontend with proper configuration
  const frontendUrl = process.env.FRONTEND_URL;
  if (!frontendUrl && process.env.NODE_ENV === 'production') {
    throw new Error('FRONTEND_URL is required in production environment');
  }

  app.enableCors({
    origin: frontendUrl || 'http://localhost:8891',
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Security: Global validation pipe with strict settings
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // ลบ properties ที่ไม่มีใน DTO
      forbidNonWhitelisted: true, // โยน error ถ้ามี properties ที่ไม่รู้จัก
      transform: true, // แปลง types อัตโนมัติ
      transformOptions: {
        enableImplicitConversion: true, // แปลง types แบบ implicit
      },
      disableErrorMessages: process.env.NODE_ENV === 'production', // ซ่อน error messages ใน production
    }),
  );

  // Security: Validate JWT_SECRET exists
  if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production environment');
  }

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('ระบบบันทึกรายรับ-รายจ่ายโรงเรียน')
    .setDescription('API สำหรับระบบจัดการรายรับ-รายจ่ายของโรงเรียน\n\n' +
      '## Authentication\n\n' +
      'API นี้ใช้ JWT Authentication โดย:\n' +
      '1. เรียก `POST /auth/login` เพื่อรับ access token\n' +
      '2. ส่ง token ใน Header: `Authorization: Bearer <token>`\n\n' +
      '## Roles\n\n' +
      '- **ADMIN**: ผู้บริหารโรงเรียน - สิทธิ์ทั้งหมด\n' +
      '- **FINANCE**: เจ้าหน้าที่การเงิน - จัดการข้อมูลการเงิน\n' +
      '- **TEACHER**: ครู - บันทึก transactions\n' +
      '- **STAFF**: เจ้าหน้าที่ทั่วไป - บันทึก transactions\n' +
      '- **AUDITOR**: เจ้าหน้าที่ตรวจสอบ - ดูรายงาน')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in your controller!
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('transactions', 'Transaction management endpoints')
    .addTag('categories', 'Transaction category management endpoints')
    .addTag('academic-years', 'Academic year management endpoints')
    .addTag('attachments', 'File attachment management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // เก็บ authorization token ไว้
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const port = process.env.PORT || 8892;
  await app.listen(port);
  
  console.log(`🚀 Backend server is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation available at: http://localhost:${port}/api-docs`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`✅ Security mode: Production`);
  } else {
    console.log(`⚠️  Security mode: Development`);
  }
}

bootstrap();

