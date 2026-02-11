import { IsOptional, IsDateString, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';

export class QueryTransactionDto {
  @ApiPropertyOptional({
    description: 'วันที่เริ่มต้น (รูปแบบ ISO 8601)',
    example: '2025-01-01',
    type: String,
    format: 'date',
  })
  @IsDateString()
  @IsOptional()
  from?: string;

  @ApiPropertyOptional({
    description: 'วันที่สิ้นสุด (รูปแบบ ISO 8601)',
    example: '2025-12-31',
    type: String,
    format: 'date',
  })
  @IsDateString()
  @IsOptional()
  to?: string;

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
    description: 'ID ผู้บันทึก',
    example: 'user-123',
    type: String,
  })
  @IsString()
  @IsOptional()
  memberId?: string;

  @ApiPropertyOptional({
    description: 'ประเภทธุรกรรม',
    enum: TransactionType,
    example: TransactionType.EXPENSE,
  })
  @IsEnum(TransactionType)
  @IsOptional()
  type?: TransactionType;

  @ApiPropertyOptional({
    description: 'หน้าข้อมูล (เริ่มที่ 1)',
    example: 1,
    type: Number,
    minimum: 1,
    default: 1,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    description: 'จำนวนข้อมูลต่อหน้า (สูงสุด 100)',
    example: 20,
    type: Number,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}

