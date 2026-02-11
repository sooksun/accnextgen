import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { TransactionType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('categories')
@ApiBearerAuth('JWT-auth')
@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ 
    summary: 'ดูรายการหมวดหมู่',
    description: 'ดูรายการหมวดหมู่ทั้งหมด หรือกรองตามประเภท (INCOME/EXPENSE)'
  })
  @ApiQuery({ name: 'type', required: false, enum: TransactionType, description: 'กรองตามประเภท' })
  @ApiResponse({ status: 200, description: 'รายการหมวดหมู่' })
  findAll(@Query('type') type?: string) {
    if (type === 'INCOME' || type === 'EXPENSE') {
      return this.categoriesService.findByType(type as TransactionType);
    }
    return this.categoriesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'ดูข้อมูลหมวดหมู่',
    description: 'ดูข้อมูลหมวดหมู่ตาม ID'
  })
  @ApiParam({ name: 'id', description: 'ID หมวดหมู่', example: 'cat-expense-1' })
  @ApiResponse({ status: 200, description: 'ข้อมูลหมวดหมู่' })
  @ApiResponse({ status: 404, description: 'ไม่พบหมวดหมู่' })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Post()
  @ApiOperation({ 
    summary: 'สร้างหมวดหมู่ใหม่',
    description: 'สร้างหมวดหมู่รายรับ-รายจ่ายใหม่'
  })
  @ApiResponse({ status: 201, description: 'สร้างหมวดหมู่สำเร็จ' })
  @ApiResponse({ status: 400, description: 'ข้อมูลไม่ถูกต้อง' })
  create(@Body() createDto: {
    name: string;
    type: 'INCOME' | 'EXPENSE';
    description?: string;
  }) {
    return this.categoriesService.create({
      name: createDto.name,
      type: createDto.type as TransactionType,
      description: createDto.description,
    });
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'แก้ไขหมวดหมู่',
    description: 'แก้ไขข้อมูลหมวดหมู่'
  })
  @ApiParam({ name: 'id', description: 'ID หมวดหมู่', example: 'cat-expense-1' })
  @ApiResponse({ status: 200, description: 'แก้ไขหมวดหมู่สำเร็จ' })
  @ApiResponse({ status: 404, description: 'ไม่พบหมวดหมู่' })
  update(@Param('id') id: string, @Body() updateDto: {
    name?: string;
    type?: 'INCOME' | 'EXPENSE';
    description?: string;
  }) {
    const data: any = { ...updateDto };
    if (updateDto.type) {
      data.type = updateDto.type as TransactionType;
    }
    return this.categoriesService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'ลบหมวดหมู่',
    description: 'ลบหมวดหมู่ (ต้องไม่มี transactions ที่ใช้หมวดหมู่นี้)'
  })
  @ApiParam({ name: 'id', description: 'ID หมวดหมู่', example: 'cat-expense-1' })
  @ApiResponse({ status: 200, description: 'ลบหมวดหมู่สำเร็จ' })
  @ApiResponse({ status: 404, description: 'ไม่พบหมวดหมู่' })
  @ApiResponse({ status: 400, description: 'ไม่สามารถลบได้ เนื่องจากมี transactions ที่ใช้หมวดหมู่นี้' })
  delete(@Param('id') id: string) {
    return this.categoriesService.delete(id);
  }
}

