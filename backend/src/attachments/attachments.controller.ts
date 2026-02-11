import { Controller, Post, Get, Body, Param, UseGuards, Request, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { AttachmentsService } from './attachments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('attachments')
@ApiBearerAuth('JWT-auth')
@Controller('attachments')
@UseGuards(JwtAuthGuard)
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  /**
   * ตรวจสอบว่าไฟล์นี้มีการอัปโหลดเข้ามาแล้วหรือยัง
   * POST /attachments/check-duplicate
   * Body: { fileBase64: string, fileName?: string, fileSize?: number }
   */
  @Post('check-duplicate')
  @ApiOperation({ 
    summary: 'ตรวจสอบไฟล์ซ้ำ',
    description: 'ตรวจสอบว่าไฟล์นี้มีการอัปโหลดเข้ามาในระบบแล้วหรือยัง (ใช้ MD5 hash)'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fileBase64: {
          type: 'string',
          description: 'ไฟล์ที่ encode เป็น base64',
          example: 'iVBORw0KGgoAAAANSUhEUgAA...',
        },
        fileName: {
          type: 'string',
          description: 'ชื่อไฟล์ (optional)',
          example: 'slip.jpg',
        },
        fileSize: {
          type: 'number',
          description: 'ขนาดไฟล์เป็น bytes (optional)',
          example: 12345,
        },
      },
      required: ['fileBase64'],
    },
  })
  @ApiResponse({ status: 200, description: 'ผลการตรวจสอบ' })
  async checkDuplicate(
    @Body() body: { fileBase64: string; fileName?: string; fileSize?: number },
    @Request() req,
  ) {
    try {
      if (!body.fileBase64) {
        return { isDuplicate: false, message: 'ไม่มีข้อมูลไฟล์' };
      }

      // แปลง base64 เป็น Buffer
      const fileBuffer = Buffer.from(body.fileBase64, 'base64');

      // คำนวณ hash
      const fileHash = this.attachmentsService.calculateFileHash(fileBuffer);

      // ตรวจสอบ duplicate
      const existingAttachment = await this.attachmentsService.checkDuplicate(fileHash);

      if (existingAttachment) {
        // ใช้ type assertion เพราะ Prisma client ยังไม่มี fileHash field (ต้องรัน migration ก่อน)
        const attachment = existingAttachment as any;
        
        return {
          isDuplicate: true,
          message: 'ไฟล์นี้มีการอัปโหลดเข้ามาในระบบแล้ว',
          existingAttachment: {
            id: attachment.id,
            fileName: attachment.fileName,
            uploadedAt: attachment.uploadedAt,
            transaction: {
              id: attachment.transaction?.id,
              description: attachment.transaction?.description,
              amount: attachment.transaction?.amount,
              txnDate: attachment.transaction?.txnDate,
              member: {
                name: attachment.transaction?.member?.name,
              },
              category: {
                name: attachment.transaction?.category?.name,
              },
              academicYear: {
                name: attachment.transaction?.academicYear?.name,
              },
            },
            uploader: {
              name: attachment.uploader?.name,
            },
          },
        };
      }

      return {
        isDuplicate: false,
        message: 'ไฟล์นี้ยังไม่มีการอัปโหลด',
      };
    } catch (error: any) {
      console.error('Error checking duplicate:', error);
      return {
        isDuplicate: false,
        message: error.message || 'เกิดข้อผิดพลาดในการตรวจสอบไฟล์',
      };
    }
  }

  /**
   * ดาวน์โหลดไฟล์ attachment
   * GET /attachments/:id
   */
  @Get(':id')
  @ApiOperation({ 
    summary: 'ดาวน์โหลดไฟล์',
    description: 'ดาวน์โหลดไฟล์แนบตาม ID'
  })
  @ApiParam({ name: 'id', description: 'ID ไฟล์แนบ', example: 'attach-123' })
  @ApiResponse({ status: 200, description: 'ไฟล์แนบ', content: { 'application/octet-stream': {} } })
  @ApiResponse({ status: 404, description: 'ไม่พบไฟล์แนบ' })
  async getAttachment(@Param('id') id: string, @Res() res: Response) {
    try {
      const attachment = await this.attachmentsService.findOne(id);
      
      if (!attachment) {
        return res.status(404).json({ message: 'ไม่พบไฟล์แนบ' });
      }

      // ตรวจสอบว่าไฟล์มีอยู่จริง
      if (!fs.existsSync(attachment.filePath)) {
        return res.status(404).json({ message: 'ไม่พบไฟล์' });
      }

      // ส่งไฟล์
      const filePath = path.resolve(attachment.filePath);
      res.setHeader('Content-Type', attachment.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(attachment.fileName)}"`);
      
      return res.sendFile(filePath);
    } catch (error: any) {
      console.error('Error getting attachment:', error);
      return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการโหลดไฟล์' });
    }
  }
}

