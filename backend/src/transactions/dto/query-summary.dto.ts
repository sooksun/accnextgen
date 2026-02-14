import { IsOptional, IsDateString, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QuerySummaryDto {
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
}

