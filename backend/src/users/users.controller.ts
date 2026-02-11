import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  @ApiOperation({ 
    summary: 'ดูรายการผู้ใช้ทั้งหมด',
    description: 'ดูรายการผู้ใช้ทั้งหมด (ต้องมีสิทธิ์ Admin หรือ Finance)'
  })
  @ApiResponse({ status: 200, description: 'รายการผู้ใช้' })
  @ApiResponse({ status: 403, description: 'ไม่มีสิทธิ์เข้าถึง' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'ดูข้อมูลผู้ใช้',
    description: 'ดูข้อมูลผู้ใช้ตาม ID'
  })
  @ApiParam({ name: 'id', description: 'ID ผู้ใช้', example: 'user-123' })
  @ApiResponse({ status: 200, description: 'ข้อมูลผู้ใช้' })
  @ApiResponse({ status: 404, description: 'ไม่พบผู้ใช้' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'สร้างผู้ใช้ใหม่',
    description: 'สร้างผู้ใช้ใหม่ (ต้องมีสิทธิ์ Admin เท่านั้น)'
  })
  @ApiResponse({ status: 201, description: 'สร้างผู้ใช้สำเร็จ' })
  @ApiResponse({ status: 400, description: 'ข้อมูลไม่ถูกต้อง' })
  @ApiResponse({ status: 403, description: 'ไม่มีสิทธิ์เข้าถึง' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  @ApiOperation({ 
    summary: 'แก้ไขข้อมูลผู้ใช้',
    description: 'แก้ไขข้อมูลผู้ใช้ (ต้องมีสิทธิ์ Admin หรือ Finance)'
  })
  @ApiParam({ name: 'id', description: 'ID ผู้ใช้', example: 'user-123' })
  @ApiResponse({ status: 200, description: 'แก้ไขข้อมูลสำเร็จ' })
  @ApiResponse({ status: 404, description: 'ไม่พบผู้ใช้' })
  @ApiResponse({ status: 403, description: 'ไม่มีสิทธิ์เข้าถึง' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'ลบผู้ใช้',
    description: 'ลบผู้ใช้ (ต้องมีสิทธิ์ Admin เท่านั้น)'
  })
  @ApiParam({ name: 'id', description: 'ID ผู้ใช้', example: 'user-123' })
  @ApiResponse({ status: 200, description: 'ลบผู้ใช้สำเร็จ' })
  @ApiResponse({ status: 404, description: 'ไม่พบผู้ใช้' })
  @ApiResponse({ status: 403, description: 'ไม่มีสิทธิ์เข้าถึง' })
  delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }

  @Patch(':id/password')
  @ApiOperation({ 
    summary: 'เปลี่ยนรหัสผ่าน',
    description: 'เปลี่ยนรหัสผ่านผู้ใช้'
  })
  @ApiParam({ name: 'id', description: 'ID ผู้ใช้', example: 'user-123' })
  @ApiResponse({ status: 200, description: 'เปลี่ยนรหัสผ่านสำเร็จ' })
  @ApiResponse({ status: 404, description: 'ไม่พบผู้ใช้' })
  async changePassword(
    @Param('id') id: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.usersService.changePassword(id, changePasswordDto.password);
    return { message: 'เปลี่ยนรหัสผ่านสำเร็จ' };
  }
}

