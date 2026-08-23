import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { UserDocument } from '../users/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private signToken(user: UserDocument): string {
    const payload: JwtPayload = {
      sub: String(user._id),
      email: user.email,
    };
    return this.jwtService.sign(payload);
  }

  async register(
    dto: RegisterDto,
  ): Promise<{ user: any; token: string }> {
    // Check for duplicate email
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    // Hash password — 12 rounds is a good balance of security and speed
    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email.toLowerCase(),
      passwordHash,
      company: dto.company,
    });

    const token = this.signToken(user);
    return { user: user.toJSON(), token };
  }

  async login(dto: LoginDto): Promise<{ user: any; token: string }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.signToken(user);
    return { user: user.toJSON(), token };
  }

  async getProfile(userId: string): Promise<any> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');
    return user.toJSON();
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<{ user: any }> {
    const updated = await this.usersService.update(userId, dto);
    return { user: updated.toJSON() };
  }
}
