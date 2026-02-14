import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TransactionType } from '@prisma/client';

export interface SlipParseResult {
  type: TransactionType; // INCOME หรือ EXPENSE
  description: string; // คำอธิบายรายการ
  amount: number; // ยอดเงิน
  date: string | null; // วันที่ในรูปแบบ YYYY-MM-DD หรือ null
}

@Injectable()
export class SlipOcrService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }
  /**
   * ฟังก์ชันสำหรับอ่านสลิป/ใบเสร็จด้วย AI Vision
   * 
   * ฟังก์ชันนี้จะรับไฟล์ (รูปภาพหรือ PDF) แล้วใช้ AI Vision 
   * (เช่น OpenAI GPT-4 Vision) ในการอ่านและดึงข้อมูลออกมา
   * 
   * @param file ไฟล์ที่อัปโหลด (Express.Multer.File)
   * @returns SlipParseResult ข้อมูลที่อ่านได้จากสลิป
   * 
   * วิธีเชื่อมต่อกับ OpenAI Vision API:
   * 
   * 1. ติดตั้ง package: npm install openai
   * 2. ใช้ API Key จาก env: process.env.OPENAI_API_KEY
   * 3. เรียก OpenAI API ดังนี้:
   * 
   * ```typescript
   * import OpenAI from 'openai';
   * 
   * const openai = new OpenAI({
   *   apiKey: process.env.OPENAI_API_KEY,
   * });
   * 
   * const response = await openai.chat.completions.create({
   *   model: process.env.AI_VISION_MODEL || 'gpt-4-vision-preview',
   *   messages: [
   *     {
   *       role: 'user',
   *       content: [
   *         {
   *           type: 'text',
   *           text: `กรุณาอ่านสลิปนี้และส่งข้อมูลกลับมาในรูปแบบ JSON:
   *           {
   *             "type": "INCOME หรือ EXPENSE",
   *             "description": "คำอธิบายสั้นๆ",
   *             "amount": 0,
   *             "date": "YYYY-MM-DD หรือ null"
   *           }`,
   *         },
   *         {
   *           type: 'image_url',
   *           image_url: {
   *             url: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
   *           },
   *         },
   *       ],
   *     },
   *   ],
   * });
   * 
   * const result = JSON.parse(response.choices[0].message.content);
   * ```
   * 
   * หมายเหตุ:
   * - สำหรับ PDF ต้องแปลงเป็นรูปภาพก่อน
   * - ควรมี error handling และ validation
   * - อาจต้องใช้ prompt engineering เพื่อให้ผลลัพธ์ถูกต้อง
   */
  async parseSlip(file: Express.Multer.File): Promise<SlipParseResult> {
    console.log(`📄 Parsing slip: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`);

    // ตรวจสอบว่าเป็นรูปภาพหรือไม่ (Gemini รองรับเฉพาะรูปภาพ)
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      throw new Error('รองรับเฉพาะไฟล์รูปภาพเท่านั้น (PDF ยังไม่รองรับ)');
    }

    if (!this.genAI) {
      const apiKey = this.configService.get<string>('GEMINI_API_KEY');
      console.error('GEMINI_API_KEY is not set. Current value:', apiKey ? '***' + apiKey.slice(-4) : 'undefined');
      throw new Error('GEMINI_API_KEY ไม่ได้ตั้งค่า กรุณาตั้งค่าใน .env');
    }

    try {
      // ตรวจสอบ file buffer
      if (!file.buffer || file.buffer.length === 0) {
        throw new Error('ไฟล์ที่อัปโหลดไม่มีข้อมูล');
      }

      // แปลงไฟล์เป็น base64
      const base64Image = file.buffer.toString('base64');
      
      console.log(`📤 Sending to Gemini API (image size: ${base64Image.length} chars)`);
      
      // ใช้ Gemini Vision model (รองรับ vision capabilities)
      // Model: gemini-2.5-flash (รองรับ vision และทำงานได้ดีในสภาพแวดล้อมนี้)
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const prompt = `กรุณาอ่านสลิป/ใบเสร็จนี้และส่งข้อมูลกลับมาในรูปแบบ JSON เท่านั้น (ไม่มีข้อความอื่น):
{
  "type": "INCOME" หรือ "EXPENSE" เท่านั้น,
  "description": "คำอธิบายรายการสั้นๆ เป็นภาษาไทย",
  "amount": จำนวนเงิน (เลขทศนิยม),
  "date": "YYYY-MM-DD" หรือ null ถ้าไม่มีวันที่
}

ระบุ type ตามเนื้อหาในสลิป:
- ถ้าเป็นสลิปรับเงิน/ใบเสร็จรับเงิน = INCOME
- ถ้าเป็นสลิปจ่ายเงิน/ใบเสร็จค่าใช้จ่าย = EXPENSE

สำคัญ: ส่งกลับมาเป็น JSON เท่านั้น ไม่มีข้อความอื่น`;

      // เรียก Gemini Vision API
      // Format สำหรับ Gemini: ต้องส่งในรูปแบบ Part array
      // ส่วนแรกคือรูปภาพ (inlineData), ส่วนที่สองคือ prompt (text)
      const result = await model.generateContent([
        {
          inlineData: {
            data: base64Image,
            mimeType: file.mimetype,
          },
        },
        {
          text: prompt,
        },
      ]);

      const response = await result.response;
      const text = response.text();
      
      console.log(`📥 Gemini API response (length: ${text.length}):`, text.substring(0, 200));
      
      // แยก JSON จาก response (อาจมี markdown code block)
      let jsonText = text.trim();
      
      // ลบ markdown code block ถ้ามี
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*/g, '').replace(/\s*```$/g, '').trim();
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*/g, '').replace(/\s*```$/g, '').trim();
      }
      
      // ลบ markdown code block ที่อาจอยู่กลางข้อความ
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      let parsed;
      try {
        parsed = JSON.parse(jsonText);
      } catch (parseError) {
        console.error('Failed to parse JSON:', jsonText);
        throw new Error(`ไม่สามารถแปลงผลลัพธ์เป็น JSON ได้: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }

      // Validate และแปลงข้อมูล
      if (!parsed.type || (parsed.type !== 'INCOME' && parsed.type !== 'EXPENSE')) {
        console.warn('Invalid type from AI:', parsed.type);
        parsed.type = 'EXPENSE'; // Default to EXPENSE
      }
      
      const type = parsed.type === 'INCOME' ? TransactionType.INCOME : TransactionType.EXPENSE;
      const amount = parseFloat(parsed.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error(`จำนวนเงินไม่ถูกต้อง: ${parsed.amount}`);
      }
      const description = parsed.description || 'รายการจากสลิป';
      const date = parsed.date || null;

      // Validate date format
      if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        console.warn('Invalid date format:', date);
        return {
          type,
          description,
          amount,
          date: null,
        };
      }

      console.log(`✅ Parsed successfully: type=${type}, amount=${amount}, date=${date || 'null'}`);

      return {
        type,
        description,
        amount,
        date,
      };
    } catch (error: any) {
      console.error('❌ Error parsing slip with Gemini:', error);
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        cause: error?.cause,
        response: error?.response,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
      });
      
      const errorMessage = error?.message || '';
      const statusCode = error?.response?.status;
      
      // Handle specific Gemini API errors
      if (statusCode === 401 || errorMessage.includes('API key') || errorMessage.includes('401')) {
        throw new Error('GEMINI_API_KEY ไม่ถูกต้องหรือไม่มีสิทธิ์ กรุณาตรวจสอบ API key');
      }
      
      if (statusCode === 404 || errorMessage.includes('404') || errorMessage.includes('not found') || errorMessage.includes('is not found')) {
        throw new Error(`Model ไม่รองรับ: 'gemini-2.5-flash' กรุณาตรวจสอบว่า model name ถูกต้องหรือ API version รองรับ`);
      }
      
      if (statusCode === 400 || errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
        throw new Error('ข้อมูลที่ส่งไปไม่ถูกต้อง กรุณาตรวจสอบไฟล์รูปภาพ (รองรับเฉพาะรูปภาพเท่านั้น)');
      }
      
      if (statusCode === 403 || errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        throw new Error('ไม่มีสิทธิ์เข้าถึง Gemini API กรุณาตรวจสอบ API key และ permissions');
      }
      
      if (statusCode === 429 || errorMessage.includes('429') || errorMessage.includes('Quota')) {
        throw new Error('เกินโควต้าของ Gemini API กรุณาลองใหม่ในภายหลัง');
      }
      
      // Generic error
      const detailedMessage = errorMessage || 'Unknown error';
      throw new Error(`ไม่สามารถอ่านสลิปได้: ${detailedMessage}`);
    }
  }

  /**
   * ฟังก์ชันช่วยในการหา category ที่เหมาะสมจาก description
   * ใช้ AI หรือ pattern matching เพื่อ map description กับ category
   */
  async findMatchingCategory(description: string): Promise<string | null> {
    // TODO: Implement category matching logic
    // อาจใช้ keyword matching หรือ AI เพื่อหา category ที่เหมาะสม
    return null; // ถ้าไม่เจอให้ใช้ default category
  }
}

