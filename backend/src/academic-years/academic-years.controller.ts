import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AcademicYearsService } from './academic-years.service';

@ApiTags('academic-years')
@Controller('academic-years')
export class AcademicYearsController {
  constructor(private readonly academicYearsService: AcademicYearsService) {}

  @Get()
  @ApiOperation({ 
    summary: 'ดูรายการปีการศึกษา',
    description: 'ดูรายการปีการศึกษาทั้งหมด'
  })
  @ApiResponse({ status: 200, description: 'รายการปีการศึกษา' })
  findAll() {
    return this.academicYearsService.findAll();
  }

  @Get('active')
  @ApiOperation({ 
    summary: 'ดูปีการศึกษาปัจจุบัน',
    description: 'ดูปีการศึกษาที่ active อยู่'
  })
  @ApiResponse({ status: 200, description: 'ปีการศึกษาปัจจุบัน' })
  findActive() {
    return this.academicYearsService.findActive();
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'ดูข้อมูลปีการศึกษา',
    description: 'ดูข้อมูลปีการศึกษาตาม ID'
  })
  @ApiParam({ name: 'id', description: 'ID ปีการศึกษา', example: 'year-2025' })
  @ApiResponse({ status: 200, description: 'ข้อมูลปีการศึกษา' })
  @ApiResponse({ status: 404, description: 'ไม่พบปีการศึกษา' })
  findOne(@Param('id') id: string) {
    return this.academicYearsService.findOne(id);
  }

  @Post()
  @ApiOperation({ 
    summary: 'สร้างปีการศึกษาใหม่',
    description: 'สร้างปีการศึกษาใหม่'
  })
  @ApiResponse({ status: 201, description: 'สร้างปีการศึกษาสำเร็จ' })
  @ApiResponse({ status: 400, description: 'ข้อมูลไม่ถูกต้อง' })
  create(@Body() createDto: {
    name: string;
    startDate: string;
    endDate: string;
    isActive?: boolean;
  }) {
    return this.academicYearsService.create({
      name: createDto.name,
      startDate: new Date(createDto.startDate),
      endDate: new Date(createDto.endDate),
      isActive: createDto.isActive,
    });
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'แก้ไขปีการศึกษา',
    description: 'แก้ไขข้อมูลปีการศึกษา'
  })
  @ApiParam({ name: 'id', description: 'ID ปีการศึกษา', example: 'year-2025' })
  @ApiResponse({ status: 200, description: 'แก้ไขปีการศึกษาสำเร็จ' })
  @ApiResponse({ status: 404, description: 'ไม่พบปีการศึกษา' })
  update(@Param('id') id: string, @Body() updateDto: {
    name?: string;
    startDate?: string;
    endDate?: string;
    isActive?: boolean;
  }) {
    const data: any = { ...updateDto };
    if (updateDto.startDate) data.startDate = new Date(updateDto.startDate);
    if (updateDto.endDate) data.endDate = new Date(updateDto.endDate);
    
    return this.academicYearsService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'ลบปีการศึกษา',
    description: 'ลบปีการศึกษา (ต้องไม่มี transactions ที่ใช้ปีการศึกษานี้)'
  })
  @ApiParam({ name: 'id', description: 'ID ปีการศึกษา', example: 'year-2025' })
  @ApiResponse({ status: 200, description: 'ลบปีการศึกษาสำเร็จ' })
  @ApiResponse({ status: 404, description: 'ไม่พบปีการศึกษา' })
  @ApiResponse({ status: 400, description: 'ไม่สามารถลบได้ เนื่องจากมี transactions ที่ใช้ปีการศึกษานี้' })
  delete(@Param('id') id: string) {
    return this.academicYearsService.delete(id);
  }
}

