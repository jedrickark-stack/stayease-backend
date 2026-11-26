import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { User } from '../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(data: {
    FullName: string;
    Email: string;
    Password: string;
  }) {
    const fullName = data.FullName?.trim();
    const email = data.Email?.trim().toLowerCase();
    const password = data.Password;

    if (!fullName || !email || !password) {
      throw new BadRequestException(
        'Full name, email, and password are required',
      );
    }

    if (password.length < 8) {
      throw new BadRequestException(
        'Password must be at least 8 characters',
      );
    }

    const existingUser = await this.userRepository.findOneBy({
      Email: email,
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      FullName: fullName,
      Email: email,
      PasswordHash: passwordHash,
      Role: 'Guest',
    });

    const savedUser = await this.userRepository.save(user);

    return {
      message: 'Registration successful',
      user: {
        UserID: savedUser.UserID,
        FullName: savedUser.FullName,
        Email: savedUser.Email,
        Role: savedUser.Role,
      },
    };
  }

  async login(data: {
    Email: string;
    Password: string;
  }) {
    const email = data.Email?.trim().toLowerCase();
    const password = data.Password;

    if (!email || !password) {
      throw new BadRequestException(
        'Email and password are required',
      );
    }

    const user = await this.userRepository.findOne({
      where: { Email: email },
      select: {
        UserID: true,
        FullName: true,
        Email: true,
        PasswordHash: true,
        Role: true,
        CreatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.PasswordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.UserID,
      email: user.Email,
      role: user.Role,
    });

    return {
      message: 'Login successful',
      access_token: accessToken,
      user: {
        UserID: user.UserID,
        FullName: user.FullName,
        Email: user.Email,
        Role: user.Role,
      },
    };
  }
}