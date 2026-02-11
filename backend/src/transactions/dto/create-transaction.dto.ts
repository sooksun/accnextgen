import { IsString, IsNumber, IsDateString, IsOptional, IsEnum, IsNotEmpty, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';

export class CreateTransactionDto {
  @ApiProperty({
    description: 'วันที่ทำธุรกรรม (รูปแบบ ISO 8601)',
    example: '2025-11-30',
    type: String,
    format: 'date',
  })
  @IsDateString()
  @IsNotEmpty()
  txnDate: string;

  @ApiProperty({
    description: 'จำนวนเงิน (บาท)',
    example: 1000.50,
    type: Number,
    minimum: 0.01,
    maximum: 999999999.99,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0.01)
  @Max(999999999.99)
  amount: number;

  @ApiPropertyOptional({
    description: 'คำอธิบายรายการ',
    example: 'ค่าอาหารกลางวัน',
    type: String,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'ประเภทธุรกรรม',
    enum: TransactionType,
    example: TransactionType.EXPENSE,
  })
  @IsEnum(TransactionType)
  @IsNotEmpty()
  type: TransactionType;

  @ApiProperty({
    description: 'ID ปีการศึกษา',
    example: 'year-2025',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  academicYearId: string;

  @ApiProperty({
    description: 'ID หมวดหมู่',
    example: 'cat-expense-1',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiPropertyOptional({
    description: 'ID ผู้บันทึก (ถ้าไม่ระบุจะใช้ผู้ใช้ที่ login)',
    example: 'user-123',
    type: String,
  })
  @IsString()
  @IsOptional()
  memberId?: string;
}

