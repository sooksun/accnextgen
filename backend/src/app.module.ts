import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AcademicYearsModule } from './academic-years/academic-years.module';
import { CategoriesModule } from './categories/categories.module';
import { TransactionsModule } from './transactions/transactions.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { SlipOcrModule } from './slip-ocr/slip-ocr.module';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // อ่าน .env จาก root directory (parent directory ของ backend/)
      envFilePath: path.resolve(process.cwd(), '../.env'),
    }),
    CommonModule, // Global module สำหรับ guards และ decorators
    PrismaModule,
    UsersModule,
    AuthModule,
    AcademicYearsModule,
    CategoriesModule,
    TransactionsModule,
    AttachmentsModule,
    SlipOcrModule,
  ],
})
export class AppModule {}

