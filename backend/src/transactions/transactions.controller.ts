import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiParam, 
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { TransactionType, TransactionSource } from '@prisma/client';
import { AttachmentsService } from '../attachments/attachments.service';
import { SlipOcrService } from '../slip-ocr/slip-ocr.service';
import { AcademicYearsService } from '../academic-years/academic-years.service';
import { CategoriesService } from '../categories/categories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { QuerySummaryDto } from './dto/query-summary.dto';

@ApiTags('transactions')
@ApiBearerAuth('JWT-auth')
@Controller('transactions')
@UseGuards(JwtAuthGuard) // ป้องกันทุก route ใน transactions controller
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly attachmentsService: AttachmentsService,
    private readonly slipOcrService: SlipOcrService,
    private readonly academicYearsService: AcademicYearsService,
    private readonly categoriesService: CategoriesService,
  ) {}

  // Endpoint สำหรับสร้าง transaction ที่มีไฟล์แนบ
  @Post('with-attachment')
  @UseInterceptors(FileInterceptor('file', { 
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  }))
  @ApiOperation({ 
    summary: 'สร้างรายการพร้อมไฟล์แนบ',
    description: 'สร้างรายการรายรับ-รายจ่ายพร้อมอัปโหลดไฟล์แนบ (รูปภาพ)'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'ไฟล์รูปภาพ (สูงสุด 10MB)',
        },
        txnDate: { type: 'string', format: 'date', example: '2025-11-30' },
        amount: { type: 'number', example: 1000.50 },
        description: { type: 'string', example: 'ค่าอาหารกลางวัน' },
        type: { enum: ['INCOME', 'EXPENSE'], example: 'EXPENSE' },
        academicYearId: { type: 'string', example: 'year-2025' },
        categoryId: { type: 'string', example: 'cat-expense-1' },
        memberId: { type: 'string', example: 'user-123' },
      },
      required: ['file', 'txnDate', 'amount', 'type', 'academicYearId', 'categoryId'],
    },
  })
  @ApiResponse({ status: 201, description: 'สร้างรายการสำเร็จ' })
  @ApiResponse({ status: 400, description: 'ข้อมูลไม่ถูกต้องหรือไฟล์ซ้ำ' })
  async createWithAttachment(
    @Body() body: any,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    try {
      if (!file) {
        throw new HttpException('กรุณาเลือกไฟล์', HttpStatus.BAD_REQUEST);
      }

      // Parse FormData
      const txnDate = Array.isArray(body.txnDate) ? body.txnDate[0] : body.txnDate;
      const amount = parseFloat(Array.isArray(body.amount) ? body.amount[0] : body.amount);
      const description = Array.isArray(body.description) ? body.description[0] : body.description;
      const type = (Array.isArray(body.type) ? body.type[0] : body.type) as 'INCOME' | 'EXPENSE';
      const academicYearId = Array.isArray(body.academicYearId) ? body.academicYearId[0] : body.academicYearId;
      const categoryId = Array.isArray(body.categoryId) ? body.categoryId[0] : body.categoryId;
      let memberId = Array.isArray(body.memberId) ? body.memberId[0] : body.memberId;
      
      memberId = memberId || req.user?.id;

      if (!memberId || !txnDate || !type || !academicYearId || !categoryId || !amount || amount <= 0) {
        throw new HttpException('กรุณากรอกข้อมูลให้ครบถ้วน', HttpStatus.BAD_REQUEST);
      }

      // สร้าง transaction
      const transaction = await this.transactionsService.create({
        txnDate: new Date(txnDate),
        amount: amount,
        description: description,
        type: type as TransactionType,
        academicYearId: academicYearId,
        categoryId: categoryId,
        memberId: memberId,
        source: TransactionSource.MANUAL,
      });

      // บันทึก attachment
      try {
        const fileBuffer = file.buffer;
        const fileHash = this.attachmentsService.calculateFileHash(fileBuffer);
        const existingAttachment = await this.attachmentsService.checkDuplicate(fileHash);
        
        if (existingAttachment) {
          console.warn(`File already exists: ${file.originalname}, skipping upload`);
        } else {
          await this.attachmentsService.create({
            transactionId: transaction.id,
            file: file,
            uploadedBy: memberId,
          });
        }
      } catch (error: any) {
        console.error('Error creating attachment:', error);
      }

      return transaction;
    } catch (error: any) {
      console.error('Error in create transaction with attachment:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'เกิดข้อผิดพลาดในการสร้างรายการ',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Endpoint สำหรับสร้าง transaction แบบไม่มีไฟล์ (JSON)
  @Post()
  @ApiOperation({ 
    summary: 'สร้างรายการรายรับ-รายจ่าย',
    description: 'สร้างรายการรายรับ-รายจ่ายใหม่ (ไม่ต้องมีไฟล์แนบ)'
  })
  @ApiResponse({ status: 201, description: 'สร้างรายการสำเร็จ' })
  @ApiResponse({ status: 400, description: 'ข้อมูลไม่ถูกต้อง' })
  async create(
    @Body() createDto: CreateTransactionDto,
    @Request() req,
  ) {
    const memberId = createDto.memberId || req.user?.id;
    
    if (!memberId) {
      throw new HttpException('ไม่พบข้อมูลผู้บันทึก', HttpStatus.BAD_REQUEST);
    }

    return this.transactionsService.create({
      txnDate: new Date(createDto.txnDate),
      amount: createDto.amount,
      description: createDto.description,
      type: createDto.type,
      academicYearId: createDto.academicYearId,
      categoryId: createDto.categoryId,
      memberId: memberId,
      source: TransactionSource.MANUAL,
    });
  }

  @Get()
  @ApiOperation({ 
    summary: 'ดูรายการรายรับ-รายจ่าย',
    description: 'ดูรายการรายรับ-รายจ่ายพร้อม pagination และ filters'
  })
  @ApiResponse({ status: 200, description: 'รายการรายรับ-รายจ่าย' })
  async findAll(@Query() query: QueryTransactionDto) {
    const filters: any = {};
    if (query.from) filters.from = new Date(query.from);
    if (query.to) filters.to = new Date(query.to);
    if (query.academicYearId) filters.academicYearId = query.academicYearId;
    if (query.categoryId) filters.categoryId = query.categoryId;
    if (query.memberId) filters.memberId = query.memberId;
    if (query.type) filters.type = query.type;
    if (query.page) filters.page = query.page;
    if (query.limit) filters.limit = query.limit;

    return this.transactionsService.findAll(filters);
  }

  @Get('summary')
  @ApiOperation({ 
    summary: 'ดูสรุปยอดรวม',
    description: 'ดูสรุปยอดรวมรายรับ, รายจ่าย, และยอดคงเหลือ'
  })
  @ApiResponse({ status: 200, description: 'สรุปยอดรวม' })
  async getSummary(@Query() query: QuerySummaryDto) {
    const filters: any = {};
    if (query.from) filters.from = new Date(query.from);
    if (query.to) filters.to = new Date(query.to);
    if (query.academicYearId) filters.academicYearId = query.academicYearId;

    return this.transactionsService.getSummary(filters);
  }

  @Get('board/category')
  @ApiOperation({ 
    summary: 'Board ตามหมวดหมู่',
    description: 'ดูสรุปรายรับ-รายจ่ายแยกตามหมวดหมู่'
  })
  @ApiResponse({ status: 200, description: 'Board ตามหมวดหมู่' })
  async getBoardByCategory(@Query() query: QuerySummaryDto) {
    const filters: any = {};
    if (query.from) filters.from = new Date(query.from);
    if (query.to) filters.to = new Date(query.to);
    if (query.academicYearId) filters.academicYearId = query.academicYearId;

    return this.transactionsService.getBoardByCategory(filters);
  }

  @Get('board/member')
  @ApiOperation({ 
    summary: 'Board ตามผู้บันทึก',
    description: 'ดูสรุปรายรับ-รายจ่ายแยกตามผู้บันทึก'
  })
  @ApiResponse({ status: 200, description: 'Board ตามผู้บันทึก' })
  async getBoardByMember(@Query() query: QuerySummaryDto) {
    const filters: any = {};
    if (query.from) filters.from = new Date(query.from);
    if (query.to) filters.to = new Date(query.to);
    if (query.academicYearId) filters.academicYearId = query.academicYearId;

    return this.transactionsService.getBoardByMember(filters);
  }

  @Get('summary/monthly')
  @ApiOperation({ 
    summary: 'สรุปรายเดือน',
    description: 'ดูสรุปรายรับ-รายจ่ายแยกตามรายเดือน'
  })
  @ApiResponse({ status: 200, description: 'สรุปรายเดือน' })
  async getMonthlySummary(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('academicYearId') academicYearId?: string,
  ) {
    const filters: any = {};
    if (from) filters.from = new Date(from);
    if (to) filters.to = new Date(to);
    if (academicYearId) filters.academicYearId = academicYearId;

    return this.transactionsService.getMonthlySummary(filters);
  }

  @Post('from-slip')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ 
    summary: 'อ่านสลิปด้วย AI',
    description: 'อัปโหลดสลิปและอ่านข้อมูลด้วย AI Vision (ยังไม่เชื่อมต่อ API จริง)'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'ไฟล์สลิป/ใบเสร็จ (รูปภาพ)',
        },
        memberId: { type: 'string', description: 'ID ผู้บันทึก (ถ้าไม่ระบุใช้ผู้ใช้ปัจจุบัน)' },
        academicYearId: { type: 'string', description: 'ID ปีการศึกษา (ถ้าไม่ระบุใช้ปีการศึกษาปัจจุบัน)' },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 200, description: 'อ่านสลิปสำเร็จ' })
  @ApiResponse({ status: 400, description: 'ไฟล์ไม่ถูกต้อง' })
  async parseSlip(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: {
      memberId?: string; // Optional: ถ้าไม่ส่งมาให้ใช้ current user
      academicYearId?: string;
    },
    @Request() req,
  ) {
    try {
      // Validate file
      if (!file) {
        throw new Error('กรุณาเลือกไฟล์ที่ต้องการอัปโหลด');
      }

      if (!file.buffer || file.buffer.length === 0) {
        throw new Error('ไฟล์ที่อัปโหลดไม่มีข้อมูล');
      }

      // ใช้ current user จาก JWT token ถ้าไม่ระบุ memberId
      const memberId = body.memberId || req.user.id;
      
      // 1. อ่านสลิปด้วย AI Vision
      const slipData = await this.slipOcrService.parseSlip(file);

      // 2. กำหนดปีการศึกษา (ถ้าไม่ระบุให้หาเองจากวันที่)
      let academicYearId = body.academicYearId;
      if (!academicYearId && slipData.date) {
        // หาปีการศึกษาจากวันที่
        const activeYear = await this.academicYearsService.findActive();
        if (activeYear) {
          academicYearId = activeYear.id;
        }
      }
      if (!academicYearId) {
        // ใช้ปีการศึกษาปัจจุบัน
        const activeYear = await this.academicYearsService.findActive();
        if (!activeYear) {
          throw new Error('ไม่พบปีการศึกษา กรุณาระบุปีการศึกษา');
        }
        academicYearId = activeYear.id;
      }

      // 3. หาหมวดหมู่ default ตาม type (ใช้หมวดแรกที่เจอ)
      const categories = await this.categoriesService.findByType(slipData.type);
      const defaultCategoryId = categories.length > 0 ? categories[0].id : null;

      // Return slipData พร้อมข้อมูลเพิ่มเติมสำหรับ frontend
      return {
        slipData: {
          ...slipData,
          date: slipData.date || new Date().toISOString().split('T')[0],
        },
        memberId,
        academicYearId,
        categoryId: defaultCategoryId,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        fileBuffer: file.buffer.toString('base64'), // ส่ง base64 ไปให้ frontend แสดง preview
      };
    } catch (error: any) {
      console.error('Error in parseSlip controller:', error);
      console.error('Error stack:', error?.stack);
      const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอ่านสลิป';
      const statusCode = error?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(
        { 
          message, 
          error: 'Failed to parse slip',
          details: error?.response?.data || error?.cause,
        },
        statusCode,
      );
    }
  }

  @Post('from-slip/create')
  @ApiOperation({ 
    summary: 'สร้างรายการจากสลิป',
    description: 'สร้างรายการรายรับ-รายจ่ายจากข้อมูลที่อ่านจากสลิป'
  })
  @ApiResponse({ status: 201, description: 'สร้างรายการสำเร็จ' })
  @ApiResponse({ status: 400, description: 'ข้อมูลไม่ถูกต้องหรือไฟล์ซ้ำ' })
  async createFromSlipData(
    @Body() body: {
      slipData: {
        type: 'INCOME' | 'EXPENSE';
        description: string;
        amount: number;
        date: string;
      };
      memberId: string;
      academicYearId: string;
      categoryId: string;
      fileName?: string;
      fileBase64?: string;
      mimeType?: string;
    },
    @Request() req,
  ) {
    // ใช้ current user จาก JWT token ถ้าไม่ระบุ memberId
    const memberId = body.memberId || req.user.id;

    // สร้าง Transaction
    const transaction = await this.transactionsService.create({
      txnDate: new Date(body.slipData.date),
      amount: body.slipData.amount,
      description: body.slipData.description,
      type: body.slipData.type as TransactionType,
      source: TransactionSource.SLIP_OCR,
      academicYearId: body.academicYearId,
      categoryId: body.categoryId,
      memberId,
    });

    // เก็บไฟล์แนบ (ถ้ามี)
    if (body.fileBase64 && body.fileName && body.mimeType) {
      try {
        const fileBuffer = Buffer.from(body.fileBase64, 'base64');
        const file: Express.Multer.File = {
          fieldname: 'file',
          originalname: body.fileName,
          encoding: '7bit',
          mimetype: body.mimeType,
          buffer: fileBuffer,
          size: fileBuffer.length,
          destination: '',
          filename: body.fileName,
          path: '',
          stream: null as any,
        };

        await this.attachmentsService.create({
          transactionId: transaction.id,
          file: file,
          uploadedBy: memberId,
        });
      } catch (error: any) {
        // ถ้าไฟล์ซ้ำ ให้ลบ transaction ที่สร้างไปแล้ว
        await this.transactionsService.delete(transaction.id);
        throw new HttpException(
          {
            message: error.message || 'เกิดข้อผิดพลาดในการเก็บไฟล์แนบ',
            error: 'Failed to create attachment',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    return transaction;
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'ดูข้อมูลรายการ',
    description: 'ดูข้อมูลรายการรายรับ-รายจ่ายตาม ID'
  })
  @ApiParam({ name: 'id', description: 'ID รายการ', example: 'txn-123' })
  @ApiResponse({ status: 200, description: 'ข้อมูลรายการ' })
  @ApiResponse({ status: 404, description: 'ไม่พบรายการ' })
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'แก้ไขรายการ',
    description: 'แก้ไขรายการรายรับ-รายจ่าย'
  })
  @ApiParam({ name: 'id', description: 'ID รายการ', example: 'txn-123' })
  @ApiResponse({ status: 200, description: 'แก้ไขรายการสำเร็จ' })
  @ApiResponse({ status: 404, description: 'ไม่พบรายการ' })
  @ApiResponse({ status: 400, description: 'ข้อมูลไม่ถูกต้อง' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateTransactionDto) {
    const data: any = {};
    if (updateDto.txnDate) {
      data.txnDate = new Date(updateDto.txnDate);
    }
    if (updateDto.amount !== undefined) {
      data.amount = updateDto.amount;
    }
    if (updateDto.description !== undefined) {
      data.description = updateDto.description;
    }
    if (updateDto.type) {
      data.type = updateDto.type;
    }
    if (updateDto.academicYearId) {
      data.academicYearId = updateDto.academicYearId;
    }
    if (updateDto.categoryId) {
      data.categoryId = updateDto.categoryId;
    }

    return this.transactionsService.update(id, data);
  }

  // Endpoint สำหรับ update transaction พร้อม attachment
  @Patch(':id/with-attachment')
  @UseInterceptors(FileInterceptor('file', { 
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  }))
  @ApiOperation({ 
    summary: 'แก้ไขรายการพร้อมไฟล์แนบ',
    description: 'แก้ไขรายการรายรับ-รายจ่ายพร้อมอัปโหลด/แก้ไข/ลบไฟล์แนบ'
  })
  @ApiParam({ name: 'id', description: 'ID รายการ', example: 'txn-123' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'ไฟล์รูปภาพใหม่ (ถ้าต้องการเปลี่ยนไฟล์)',
        },
        txnDate: { type: 'string', format: 'date' },
        amount: { type: 'number' },
        description: { type: 'string' },
        type: { enum: ['INCOME', 'EXPENSE'] },
        academicYearId: { type: 'string' },
        categoryId: { type: 'string' },
        shouldDeleteAttachment: { type: 'boolean', description: 'ลบไฟล์แนบเดิม' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'แก้ไขรายการสำเร็จ' })
  @ApiResponse({ status: 404, description: 'ไม่พบรายการ' })
  @ApiResponse({ status: 400, description: 'ข้อมูลไม่ถูกต้อง' })
  async updateWithAttachment(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Request() req,
  ) {
    try {
      // Parse FormData
      const txnDate = Array.isArray(body.txnDate) ? body.txnDate[0] : body.txnDate;
      const amount = body.amount ? parseFloat(Array.isArray(body.amount) ? body.amount[0] : body.amount) : undefined;
      const description = Array.isArray(body.description) ? body.description[0] : body.description;
      const type = (Array.isArray(body.type) ? body.type[0] : body.type) as 'INCOME' | 'EXPENSE' | undefined;
      const academicYearId = Array.isArray(body.academicYearId) ? body.academicYearId[0] : body.academicYearId;
      const categoryId = Array.isArray(body.categoryId) ? body.categoryId[0] : body.categoryId;
      const shouldDeleteAttachment = body.shouldDeleteAttachment === 'true' || body.shouldDeleteAttachment === true;

      // Update transaction data
      const updateData: any = {};
      if (txnDate) updateData.txnDate = new Date(txnDate);
      if (amount !== undefined) updateData.amount = amount;
      if (description !== undefined) updateData.description = description || null;
      if (type) updateData.type = type as TransactionType;
      if (academicYearId) updateData.academicYearId = academicYearId;
      if (categoryId) updateData.categoryId = categoryId;

      const transaction = await this.transactionsService.update(id, updateData);

      // จัดการ attachment
      const memberId = req.user?.id;
      
      // ลบ attachment เดิม (ถ้าต้องการ)
      if (shouldDeleteAttachment || file) {
        const existingAttachments = await this.attachmentsService.findByTransaction(id);
        for (const attachment of existingAttachments) {
          await this.attachmentsService.delete(attachment.id);
        }
      }

      // เพิ่ม attachment ใหม่ (ถ้ามีไฟล์)
      if (file && memberId) {
        try {
          const fileBuffer = file.buffer;
          const fileHash = this.attachmentsService.calculateFileHash(fileBuffer);
          const existingAttachment = await this.attachmentsService.checkDuplicate(fileHash);
          
          if (!existingAttachment) {
            await this.attachmentsService.create({
              transactionId: transaction.id,
              file: file,
              uploadedBy: memberId,
            });
          } else {
            console.warn(`File already exists: ${file.originalname}, skipping upload`);
          }
        } catch (error: any) {
          console.error('Error creating attachment:', error);
        }
      }

      return transaction;
    } catch (error: any) {
      console.error('Error updating transaction with attachment:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'เกิดข้อผิดพลาดในการแก้ไขรายการ',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'ลบรายการ',
    description: 'ลบรายการรายรับ-รายจ่าย (ไฟล์แนบจะถูกลบด้วย)'
  })
  @ApiParam({ name: 'id', description: 'ID รายการ', example: 'txn-123' })
  @ApiResponse({ status: 200, description: 'ลบรายการสำเร็จ' })
  @ApiResponse({ status: 404, description: 'ไม่พบรายการ' })
  delete(@Param('id') id: string) {
    return this.transactionsService.delete(id);
  }
}

