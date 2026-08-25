import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
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
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { EntitlementsService } from '../entitlements/entitlements.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly entitlements: EntitlementsService,
  ) {}

  private signToken(user: UserDocument): string {
    const payload: JwtPayload = {
      sub: String(user._id),
      email: user.email,
    };
    return this.jwtService.sign(payload);
  }

  private enrichUser(user: UserDocument) {
    const json = user.toJSON();
    return {
      ...json,
      entitlements: this.entitlements.snapshot(user),
    };
  }

  async register(
    dto: RegisterDto,
  ): Promise<{ user: any; token: string }> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email.toLowerCase(),
      passwordHash,
      company: dto.company,
      role: 'USER',
      plan: 'free',
      subscriptionStatus: 'active',
      accountStatus: 'active',
    });

    await this.subscriptionsService.ensureStarterSubscription(String(user._id));

    const token = this.signToken(user);
    return { user: this.enrichUser(user), token };
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

    if (user.accountStatus === 'suspended') {
      throw new ForbiddenException({
        message: 'Your account has been suspended. Contact support.',
        code: 'ACCOUNT_SUSPENDED',
      });
    }

    // Expire Pro if past expiresAt before issuing session
    const fresh =
      (await this.subscriptionsService.expireIfNeeded(String(user._id))) || user;

    const token = this.signToken(fresh);
    return { user: this.enrichUser(fresh), token };
  }

  async getProfile(userId: string): Promise<any> {
    await this.subscriptionsService.expireIfNeeded(userId);
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');
    return this.enrichUser(user);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<{ user: any }> {
    // Explicitly strip any attempt to change privileged fields
    const safe: UpdateProfileDto = {
      name: dto.name,
      email: dto.email,
      businessName: dto.businessName,
      company: dto.company,
      currency: dto.currency,
      bankDetails: dto.bankDetails,
      aiSettings: dto.aiSettings,
    };
    const updated = await this.usersService.update(userId, safe as any);
    return { user: this.enrichUser(updated) };
  }
}
