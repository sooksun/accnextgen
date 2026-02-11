import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ 
    summary: 'เข้าสู่ระบบ',
    description: 'เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน เพื่อรับ JWT access token'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'เข้าสู่ระบบสำเร็จ',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'user-123',
          name: 'สุขสันต์ สอนนวล',
          email: 'admin@school.ac.th',
          role: 'ADMIN'
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @ApiOperation({ 
    summary: 'สมัครสมาชิก',
    description: 'สมัครสมาชิกใหม่ (สำหรับการทดสอบหรือการใช้งานครั้งแรก)'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'สมัครสมาชิกสำเร็จ',
    schema: {
      example: {
        id: 'user-123',
        name: 'สุขสันต์ สอนนวล',
        email: 'user@school.ac.th',
        role: 'STAFF'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'อีเมลซ้ำหรือข้อมูลไม่ถูกต้อง' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'ดูข้อมูลผู้ใช้',
    description: 'ดูข้อมูลผู้ใช้ที่ login อยู่ (ต้องมี JWT token)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'ข้อมูลผู้ใช้',
    schema: {
      example: {
        id: 'user-123',
        name: 'สุขสันต์ สอนนวล',
        email: 'admin@school.ac.th',
        role: 'ADMIN',
        createdAt: '2025-01-01T00:00:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - ไม่มี token หรือ token หมดอายุ' })
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.id);
  }
}

