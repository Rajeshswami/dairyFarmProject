import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

import {
  User,
  UserDocument,
  UserRole,
} from './schema/user.schema';

import { LoginDto } from './dto/login.dto';
import { BootstrapAdminDto } from './dto/bootstrap-admin.dto';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    private readonly jwtService: JwtService,
  ) {}

  async bootstrapAdmin(dto: BootstrapAdminDto) {
    const userCount = await this.userModel.countDocuments();

    if (userCount > 0) {
      throw new BadRequestException(
        'Admin already initialized',
      );
    }

    const email = dto.email.toLowerCase().trim();

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.userModel.create({
      name: dto.name,
      email,
      passwordHash,
      role: UserRole.ADMIN,
      active: true,
    });

    return {
      message: 'Admin created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async validateUser(
    email: string,
    password: string,
  ) {
    const user = await this.userModel.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user || !user.active) {
      return null;
    }

    const passwordValid = await bcrypt.compare(
      password,
      user.passwordHash,
    );

    if (!passwordValid) {
      return null;
    }

    return user;
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(
      dto.email,
      dto.password,
    );

    if (!user) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken =
      await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async findById(id: string) {
    return this.userModel.findById(id);
  }
  async createUser(dto: CreateUserDto) {
  const email = dto.email.toLowerCase().trim();

  const existingUser = await this.userModel.findOne({
    email,
  });

  if (existingUser) {
    throw new BadRequestException(
      'User with this email already exists',
    );
  }

  const passwordHash = await bcrypt.hash(
    dto.password,
    12,
  );

  const user = await this.userModel.create({
    name: dto.name,
    email,
    passwordHash,
    role: dto.role,
    active: true,
  });

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
  };
}
}