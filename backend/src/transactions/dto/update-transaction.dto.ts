import { IsString, IsNumber, IsDateString, IsOptional, IsEnum, IsBoolean, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';

export class UpdateTransactionDto {
  @ApiPropertyOptional({
    description: 'วันที่ทำธุรกรรม (รูปแบบ ISO 8601)',
    example: '2025-11-30',
    type: String,
    format: 'date',
  })
  @IsDateString()
  @IsOptional()
  txnDate?: string;

  @ApiPropertyOptional({
    description: 'จำนวนเงิน (บาท)',
    example: 1000.50,
    type: Number,
    minimum: 0.01,
    maximum: 999999999.99,
  })
  @IsNumber()
  @IsOptional()
  @Min(0.01)
  @Max(999999999.99)
  amount?: number;

  @ApiPropertyOptional({
    description: 'คำอธิบายรายการ',
    example: 'ค่าอาหารกลางวัน',
    type: String,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'ประเภทธุรกรรม',
    enum: TransactionType,
    example: TransactionType.EXPENSE,
  })
  @IsEnum(TransactionType)
  @IsOptional()
  type?: TransactionType;

  @ApiPropertyOptional({
    description: 'ID ปีการศึกษา',
    example: 'year-2025',
    type: String,
  })
  @IsString()
  @IsOptional()
  academicYearId?: string;

  @ApiPropertyOptional({
    description: 'ID หมวดหมู่',
    example: 'cat-expense-1',
    type: String,
  })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'ลบไฟล์แนบ (true = ลบไฟล์แนบ)',
    example: false,
    type: Boolean,
  })
  @IsBoolean()
  @IsOptional()
  shouldDeleteAttachment?: boolean;
}

