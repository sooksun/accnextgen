import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SlipOcrService } from './slip-ocr.service';

@Module({
  imports: [ConfigModule],
  providers: [SlipOcrService],
  exports: [SlipOcrService],
})
export class SlipOcrModule {}

