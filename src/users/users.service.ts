
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from '../entities/user.entity';
import { Reservation } from '../entities/reservation.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
  ) {}

  async findAll() {
    return this.userRepository.find({
      select: {
        UserID: true,
        FullName: true,
        Email: true,
        Role: true,
        CreatedAt: true,
      },
    });
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({
      where: { UserID: id },
      select: {
        UserID: true,
        FullName: true,
        Email: true,
        Role: true,
        CreatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async create(data: {
    FullName: string;
    Email: string;
    Password: string;
    Role?: string;
  }) {
    const FullName = data.FullName?.trim();
    const Email = data.Email?.trim().toLowerCase();

    if (!FullName || !Email || !data.Password) {
      throw new BadRequestException(
        'FullName, Email, and Password are required',
      );
    }

    if (data.Password.length < 8) {
      throw new BadRequestException(
        'Password must be at least 8 characters',
      );
    }

    if (data.Role && !['Guest', 'Admin'].includes(data.Role)) {
      throw new BadRequestException('Invalid user role');
    }

    const existingUser = await this.userRepository.findOne({
      where: { Email },
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const PasswordHash = await bcrypt.hash(data.Password, 10);

    const user = this.userRepository.create({
      FullName,
      Email,
      PasswordHash,
      Role: data.Role || 'Guest',
    });

    const savedUser = await this.userRepository.save(user);

    return this.findOne(savedUser.UserID);
  }

  async update(
    id: number,
    data: {
      FullName?: string;
      Email?: string;
      Password?: string;
      Role?: string;
    },
  ) {
    const user = await this.userRepository.findOne({
      where: { UserID: id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (data.FullName !== undefined) {
      const FullName = data.FullName.trim();

      if (!FullName) {
        throw new BadRequestException('FullName cannot be empty');
      }

      user.FullName = FullName;
    }

    if (data.Email !== undefined) {
      const Email = data.Email.trim().toLowerCase();

      if (!Email) {
        throw new BadRequestException('Email cannot be empty');
      }

      const existingUser = await this.userRepository.findOne({
        where: { Email },
      });

      if (existingUser && existingUser.UserID !== id) {
        throw new ConflictException('Email is already registered');
      }

      user.Email = Email;
    }

    if (data.Password !== undefined) {
      if (data.Password.length < 8) {
        throw new BadRequestException(
          'Password must be at least 8 characters',
        );
      }

      user.PasswordHash = await bcrypt.hash(data.Password, 10);
    }

    if (data.Role !== undefined) {
      if (!['Guest', 'Admin'].includes(data.Role)) {
        throw new BadRequestException('Invalid user role');
      }

      if (user.Role === 'Admin' && data.Role === 'Guest') {
        const adminCount = await this.userRepository.count({
          where: { Role: 'Admin' },
        });

        if (adminCount <= 1) {
          throw new BadRequestException(
            'Cannot demote the last Admin account',
          );
        }
      }

      user.Role = data.Role;
    }

    await this.userRepository.save(user);

    return this.findOne(id);
  }

  async remove(id: number, requestingUserId: number) {
    const user = await this.userRepository.findOne({
      where: { UserID: id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (id === requestingUserId) {
      throw new ForbiddenException(
        'You cannot delete your own account',
      );
    }

    if (user.Role === 'Admin') {
      const adminCount = await this.userRepository.count({
        where: { Role: 'Admin' },
      });

      if (adminCount <= 1) {
        throw new BadRequestException(
          'Cannot delete the last Admin account',
        );
      }
    }

    const reservationCount = await this.reservationRepository
      .createQueryBuilder('reservation')
      .innerJoin('reservation.User', 'user')
      .where('user.UserID = :id', { id })
      .getCount();

    if (reservationCount > 0) {
      throw new BadRequestException(
        'Cannot delete user with existing reservations',
      );
    }

    await this.userRepository.remove(user);

    return {
      message: 'User deleted successfully',
    };
  }
}

