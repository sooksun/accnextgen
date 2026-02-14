import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType } from '@prisma/client';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.transactionCategory.findMany({
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
  }

  async findByType(type: TransactionType) {
    return this.prisma.transactionCategory.findMany({
      where: { type },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.transactionCategory.findUnique({
      where: { id },
    });
  }

  async create(data: {
    name: string;
    type: TransactionType;
    description?: string;
  }) {
    return this.prisma.transactionCategory.create({
      data: {
        name: data.name,
        type: data.type,
        description: data.description,
      },
    });
  }

  async update(id: string, data: {
    name?: string;
    type?: TransactionType;
    description?: string;
  }) {
    return this.prisma.transactionCategory.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.transactionCategory.delete({
      where: { id },
    });
  }
}

