import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { AttachmentsModule } from '../attachments/attachments.module';
import { SlipOcrModule } from '../slip-ocr/slip-ocr.module';
import { AcademicYearsModule } from '../academic-years/academic-years.module';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [AttachmentsModule, SlipOcrModule, AcademicYearsModule, CategoriesModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}

