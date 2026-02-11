import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType, TransactionSource } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  count: number;
}

export interface CategoryBoardItem {
  categoryId: string;
  categoryName: string;
  categoryType: TransactionType;
  totalAmount: number;
  transactionCount: number;
}

export interface MemberBoardItem {
  memberId: string;
  memberName: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
}

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    txnDate: Date;
    amount: number;
    description?: string;
    type: TransactionType;
    source?: TransactionSource;
    academicYearId: string;
    categoryId: string;
    memberId: string;
  }) {
    return this.prisma.transaction.create({
      data: {
        txnDate: data.txnDate,
        amount: new Decimal(data.amount),
        description: data.description,
        type: data.type,
        source: data.source || TransactionSource.MANUAL,
        academicYearId: data.academicYearId,
        categoryId: data.categoryId,
        memberId: data.memberId,
      },
      include: {
        academicYear: true,
        category: true,
        member: true,
      },
    });
  }

  async findAll(filters?: {
    from?: Date;
    to?: Date;
    academicYearId?: string;
    categoryId?: string;
    memberId?: string;
    type?: TransactionType;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = Math.min(filters?.limit || 20, 100); // Default 20, max 100 เพื่อ performance
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.from || filters?.to) {
      where.txnDate = {};
      if (filters.from) where.txnDate.gte = filters.from;
      if (filters.to) {
        // เพิ่มเวลา 23:59:59 ให้กับวันสุดท้าย
        const endDate = new Date(filters.to);
        endDate.setHours(23, 59, 59, 999);
        where.txnDate.lte = endDate;
      }
    }

    if (filters?.academicYearId) {
      where.academicYearId = filters.academicYearId;
    }

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.memberId) {
      where.memberId = filters.memberId;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: {
          academicYear: true,
          category: true,
          member: true,
          attachments: true,
        },
        orderBy: { txnDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSummary(filters?: {
    from?: Date;
    to?: Date;
    academicYearId?: string;
  }): Promise<TransactionSummary> {
    const where: any = {};

    if (filters?.from || filters?.to) {
      where.txnDate = {};
      if (filters.from) where.txnDate.gte = filters.from;
      if (filters.to) {
        const endDate = new Date(filters.to);
        endDate.setHours(23, 59, 59, 999);
        where.txnDate.lte = endDate;
      }
    }

    if (filters?.academicYearId) {
      where.academicYearId = filters.academicYearId;
    }

    const [incomeResult, expenseResult, count] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { ...where, type: TransactionType.INCOME },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { ...where, type: TransactionType.EXPENSE },
        _sum: { amount: true },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    const totalIncome = incomeResult._sum.amount
      ? Number(incomeResult._sum.amount)
      : 0;
    const totalExpense = expenseResult._sum.amount
      ? Number(expenseResult._sum.amount)
      : 0;

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      count,
    };
  }

  async getBoardByCategory(filters?: {
    from?: Date;
    to?: Date;
    academicYearId?: string;
  }): Promise<CategoryBoardItem[]> {
    const where: any = {};

    if (filters?.from || filters?.to) {
      where.txnDate = {};
      if (filters.from) where.txnDate.gte = filters.from;
      if (filters.to) {
        const endDate = new Date(filters.to);
        endDate.setHours(23, 59, 59, 999);
        where.txnDate.lte = endDate;
      }
    }

    if (filters?.academicYearId) {
      where.academicYearId = filters.academicYearId;
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      include: {
        category: true,
      },
    });

    // Group by category
    const categoryMap = new Map<string, CategoryBoardItem>();

    transactions.forEach((txn) => {
      const categoryId = txn.categoryId;
      const existing = categoryMap.get(categoryId);

      if (existing) {
        existing.totalAmount += Number(txn.amount);
        existing.transactionCount += 1;
      } else {
        categoryMap.set(categoryId, {
          categoryId: txn.category.id,
          categoryName: txn.category.name,
          categoryType: txn.category.type,
          totalAmount: Number(txn.amount),
          transactionCount: 1,
        });
      }
    });

    return Array.from(categoryMap.values()).sort((a, b) => 
      b.totalAmount - a.totalAmount
    );
  }

  async getMonthlySummary(filters?: {
    from?: Date;
    to?: Date;
    academicYearId?: string;
  }): Promise<Array<{
    month: string; // "YYYY-MM"
    monthLabel: string; // "มกราคม 2568"
    totalIncome: number;
    totalExpense: number;
    balance: number;
  }>> {
    const where: any = {};

    if (filters?.from || filters?.to) {
      where.txnDate = {};
      if (filters.from) where.txnDate.gte = filters.from;
      if (filters.to) {
        const endDate = new Date(filters.to);
        endDate.setHours(23, 59, 59, 999);
        where.txnDate.lte = endDate;
      }
    }

    if (filters?.academicYearId) {
      where.academicYearId = filters.academicYearId;
    }

    // ดึงข้อมูลทั้งหมด
    const transactions = await this.prisma.transaction.findMany({
      where,
      select: {
        txnDate: true,
        type: true,
        amount: true,
      },
    });

    // จัดกลุ่มตามเดือน
    const monthMap = new Map<string, {
      totalIncome: number;
      totalExpense: number;
    }>();

    transactions.forEach((txn) => {
      const date = new Date(txn.txnDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const existing = monthMap.get(monthKey) || { totalIncome: 0, totalExpense: 0 };
      
      if (txn.type === TransactionType.INCOME) {
        existing.totalIncome += Number(txn.amount);
      } else {
        existing.totalExpense += Number(txn.amount);
      }
      
      monthMap.set(monthKey, existing);
    });

    // แปลงเป็น array และเรียงตามเดือน
    const monthNames = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    return Array.from(monthMap.entries())
      .map(([monthKey, data]) => {
        const [year, month] = monthKey.split('-');
        const monthIndex = parseInt(month) - 1;
        const buddhistYear = parseInt(year) + 543;
        
        return {
          month: monthKey,
          monthLabel: `${monthNames[monthIndex]} ${buddhistYear}`,
          totalIncome: data.totalIncome,
          totalExpense: data.totalExpense,
          balance: data.totalIncome - data.totalExpense,
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  async getBoardByMember(filters?: {
    from?: Date;
    to?: Date;
    academicYearId?: string;
  }): Promise<MemberBoardItem[]> {
    const where: any = {};

    if (filters?.from || filters?.to) {
      where.txnDate = {};
      if (filters.from) where.txnDate.gte = filters.from;
      if (filters.to) {
        const endDate = new Date(filters.to);
        endDate.setHours(23, 59, 59, 999);
        where.txnDate.lte = endDate;
      }
    }

    if (filters?.academicYearId) {
      where.academicYearId = filters.academicYearId;
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      include: {
        member: true,
      },
    });

    // Group by member
    const memberMap = new Map<string, MemberBoardItem>();

    transactions.forEach((txn) => {
      const memberId = txn.memberId;
      const existing = memberMap.get(memberId);

      if (existing) {
        if (txn.type === TransactionType.INCOME) {
          existing.totalIncome += Number(txn.amount);
        } else {
          existing.totalExpense += Number(txn.amount);
        }
        existing.transactionCount += 1;
        existing.balance = existing.totalIncome - existing.totalExpense;
      } else {
        memberMap.set(memberId, {
          memberId: txn.member.id,
          memberName: txn.member.name,
          totalIncome: txn.type === TransactionType.INCOME ? Number(txn.amount) : 0,
          totalExpense: txn.type === TransactionType.EXPENSE ? Number(txn.amount) : 0,
          balance: txn.type === TransactionType.INCOME ? Number(txn.amount) : -Number(txn.amount),
          transactionCount: 1,
        });
      }
    });

    return Array.from(memberMap.values()).sort((a, b) => 
      b.transactionCount - a.transactionCount
    );
  }

  async findOne(id: string) {
    return this.prisma.transaction.findUnique({
      where: { id },
      include: {
        academicYear: true,
        category: true,
        member: true,
        attachments: true,
      },
    });
  }

  async update(id: string, data: {
    txnDate?: Date;
    amount?: number;
    description?: string;
    type?: TransactionType;
    academicYearId?: string;
    categoryId?: string;
  }) {
    const updateData: any = { ...data };
    if (data.amount !== undefined) {
      updateData.amount = new Decimal(data.amount);
    }
    
    return this.prisma.transaction.update({
      where: { id },
      data: updateData,
      include: {
        academicYear: true,
        category: true,
        member: true,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.transaction.delete({
      where: { id },
    });
  }
}

