import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AcademicYearsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.academicYear.findMany({
      orderBy: { startDate: 'desc' },
    });
  }

  async findActive() {
    return this.prisma.academicYear.findFirst({
      where: { isActive: true },
    });
  }

  async findOne(id: string) {
    return this.prisma.academicYear.findUnique({
      where: { id },
    });
  }

  async create(data: {
    name: string;
    startDate: Date;
    endDate: Date;
    isActive?: boolean;
  }) {
    // ถ้า set เป็น active ให้ disable ปีอื่นก่อน
    if (data.isActive) {
      await this.prisma.academicYear.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    return this.prisma.academicYear.create({
      data: {
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        isActive: data.isActive || false,
      },
    });
  }

  async update(id: string, data: {
    name?: string;
    startDate?: Date;
    endDate?: Date;
    isActive?: boolean;
  }) {
    // ถ้า set เป็น active ให้ disable ปีอื่นก่อน
    if (data.isActive) {
      await this.prisma.academicYear.updateMany({
        where: { isActive: true, id: { not: id } },
        data: { isActive: false },
      });
    }

    return this.prisma.academicYear.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.academicYear.delete({
      where: { id },
    });
  }
}

