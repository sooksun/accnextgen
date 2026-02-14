import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class AttachmentsService {
  // Normalize upload directory path สำหรับ Linux case-sensitive filesystem
  // ใช้ path.resolve() เพื่อแปลงเป็น absolute path และ normalize separators
  private readonly uploadDir: string = (() => {
    const dir = process.env.UPLOAD_DIR || './uploads';
    // แปลงเป็น absolute path และ normalize (แปลง backslash เป็น forward slash)
    const normalized = path.resolve(process.cwd(), dir);
    // บังคับใช้ lowercase สำหรับ directory name เพื่อความเข้ากันได้กับ Linux
    const parts = normalized.split(path.sep);
    // ตรวจสอบว่าส่วนสุดท้ายเป็น 'uploads' หรือไม่ และแปลงเป็น lowercase
    if (parts[parts.length - 1]) {
      parts[parts.length - 1] = parts[parts.length - 1].toLowerCase();
    }
    return parts.join(path.sep);
  })();

  constructor(private prisma: PrismaService) {
    // สร้างโฟลเดอร์ uploads ถ้ายังไม่มี
    // ใช้ recursive: true เพื่อสร้าง parent directories ทั้งหมดถ้ายังไม่มี
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * คำนวณ MD5 hash ของไฟล์
   */
  calculateFileHash(buffer: Buffer): string {
    return crypto.createHash('md5').update(buffer).digest('hex');
  }

  /**
   * ตรวจสอบว่าไฟล์นี้มีการอัปโหลดเข้ามาแล้วหรือยัง (ใช้ hash)
   */
  async checkDuplicate(fileHash: string) {
    const existingAttachment = await this.prisma.attachment.findFirst({
      where: { fileHash },
      include: {
        transaction: {
          include: {
            member: true,
            category: true,
            academicYear: true,
          },
        },
        uploader: true,
      },
    });

    return existingAttachment;
  }

  async create(data: {
    transactionId: string;
    file: Express.Multer.File;
    uploadedBy: string;
  }) {
    // คำนวณ hash ของไฟล์
    const fileHash = this.calculateFileHash(data.file.buffer);

    // ตรวจสอบว่าไฟล์นี้มีอยู่แล้วหรือยัง
    const existingAttachment = await this.checkDuplicate(fileHash);
    if (existingAttachment) {
      throw new Error('ไฟล์นี้มีการอัปโหลดเข้ามาในระบบแล้ว');
    }

    // สร้างชื่อไฟล์ใหม่ (เพื่อป้องกันชื่อไฟล์ซ้ำ)
    // Normalize filename สำหรับ Linux case-sensitive filesystem
    const timestamp = Date.now();
    const ext = path.extname(data.file.originalname).toLowerCase();
    // แปลงชื่อไฟล์เป็น lowercase เพื่อหลีกเลี่ยงปัญหา case-sensitive
    const originalName = path.basename(data.file.originalname, ext).toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const fileName = `${timestamp}-${originalName}${ext}`;
    // ใช้ path.join() และ normalize เพื่อรองรับทั้ง Windows และ Linux
    const filePath = path.normalize(path.join(this.uploadDir, fileName));

    // เก็บไฟล์ (ใช้ absolute path)
    fs.writeFileSync(filePath, data.file.buffer);

    // บันทึกข้อมูลลง database
    return this.prisma.attachment.create({
      data: {
        transactionId: data.transactionId,
        fileName: data.file.originalname,
        filePath: filePath,
        mimeType: data.file.mimetype,
        fileSize: data.file.size,
        fileHash: fileHash,
        uploadedBy: data.uploadedBy,
      },
    });
  }

  async findByTransaction(transactionId: string) {
    return this.prisma.attachment.findMany({
      where: { transactionId },
      include: {
        uploader: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.attachment.findUnique({
      where: { id },
      include: {
        transaction: true,
        uploader: true,
      },
    });
  }

  async delete(id: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id },
    });

    if (attachment) {
      // Normalize file path ก่อนตรวจสอบและลบ (รองรับ Linux case-sensitive)
      const normalizedPath = path.normalize(attachment.filePath);
      
      // ลบไฟล์ (ตรวจสอบว่ามีอยู่จริงก่อนลบ)
      if (fs.existsSync(normalizedPath)) {
        try {
          fs.unlinkSync(normalizedPath);
        } catch (error) {
          // Log error แต่ไม่ throw เพื่อให้สามารถลบข้อมูลใน database ได้
          console.error(`Error deleting file: ${normalizedPath}`, error);
        }
      }

      // ลบข้อมูลใน database
      return this.prisma.attachment.delete({
        where: { id },
      });
    }

    return null;
  }
}

