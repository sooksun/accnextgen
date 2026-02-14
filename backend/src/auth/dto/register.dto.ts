import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({
    description: 'ชื่อผู้ใช้',
    example: 'สุขสันต์ สอนนวล',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'อีเมลผู้ใช้',
    example: 'user@school.ac.th',
    type: String,
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'รหัสผ่าน (ขั้นต่ำ 6 ตัวอักษร)',
    example: 'password123',
    type: String,
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    description: 'บทบาทผู้ใช้',
    enum: UserRole,
    example: UserRole.STAFF,
    default: UserRole.STAFF,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

