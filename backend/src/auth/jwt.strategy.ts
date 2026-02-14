import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  // Cache user data เพื่อลด database calls
  private userCache = new Map<string, { user: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is required in environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload) {
    // ตรวจสอบ cache ก่อน
    const cached = this.userCache.get(payload.sub);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
      return cached.user;
    }

    // ถ้าไม่มี cache หรือหมดอายุ เรียก database
    const user = await this.usersService.findOne(payload.sub);
    
    if (!user) {
      throw new UnauthorizedException();
    }

    // Exclude passwordHash from return
    const { passwordHash, ...result } = user;

    // Cache result
    this.userCache.set(payload.sub, {
      user: result,
      timestamp: now,
    });

    // Cleanup old cache entries (ป้องกัน memory leak)
    if (this.userCache.size > 1000) {
      const entries = Array.from(this.userCache.entries());
      entries.forEach(([key, value]) => {
        if ((now - value.timestamp) > this.CACHE_TTL) {
          this.userCache.delete(key);
        }
      });
    }

    return result;
  }
}
