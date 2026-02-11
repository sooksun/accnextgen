import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'ชื่อผู้ใช้',
    example: 'สุขสันต์ สอนนวล',
    type: String,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'อีเมลผู้ใช้',
    example: 'user@school.ac.th',
    type: String,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'บทบาทผู้ใช้',
    enum: UserRole,
    example: UserRole.STAFF,
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}

