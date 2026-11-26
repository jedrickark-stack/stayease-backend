
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Room } from '../entities/room.entity';
import { RoomType } from '../entities/room-type.entity';
import { Reservation } from '../entities/reservation.entity';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,

    @InjectRepository(RoomType)
    private readonly roomTypeRepository: Repository<RoomType>,

    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
  ) {}

  private validatePrice(price: number) {
    if (
      typeof price !== 'number' ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      throw new BadRequestException(
        'Price per night must be a positive number',
      );
    }
  }

  private validateStatus(status: string) {
    if (!['Available', 'Unavailable'].includes(status)) {
      throw new BadRequestException('Invalid room status');
    }
  }

  async create(data: {
    RoomNumber: string;
    RoomTypeID: number;
    PricePerNight: number;
    Status?: 'Available' | 'Unavailable';
  }) {
    const roomNumber = data.RoomNumber?.trim();

    if (!roomNumber) {
      throw new BadRequestException('Room number is required');
    }

    this.validatePrice(data.PricePerNight);

    if (
      !Number.isInteger(data.RoomTypeID) ||
      data.RoomTypeID <= 0
    ) {
      throw new BadRequestException('Invalid room type ID');
    }

    const existingRoom = await this.roomRepository.findOneBy({
      RoomNumber: roomNumber,
    });

    if (existingRoom) {
      throw new ConflictException('Room number already exists');
    }

    const status = data.Status ?? 'Available';
    this.validateStatus(status);

    const roomType = await this.roomTypeRepository.findOneBy({
      RoomTypeID: data.RoomTypeID,
    });

    if (!roomType) {
      throw new NotFoundException('Room type not found');
    }

    const room = this.roomRepository.create({
      RoomNumber: roomNumber,
      RoomType: roomType,
      PricePerNight: data.PricePerNight,
      Status: status,
    });

    return this.roomRepository.save(room);
  }

  findAll() {
    return this.roomRepository.find({
      relations: { RoomType: true },
    });
  }

  async findOne(id: number) {
    const room = await this.roomRepository.findOne({
      where: { RoomID: id },
      relations: { RoomType: true },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return room;
  }

  async update(
    id: number,
    data: {
      RoomNumber?: string;
      RoomTypeID?: number;
      PricePerNight?: number;
      Status?: 'Available' | 'Unavailable';
    },
  ) {
    const room = await this.findOne(id);

    if (data.RoomTypeID !== undefined) {
      if (
        !Number.isInteger(data.RoomTypeID) ||
        data.RoomTypeID <= 0
      ) {
        throw new BadRequestException('Invalid room type ID');
      }

      const roomType = await this.roomTypeRepository.findOneBy({
        RoomTypeID: data.RoomTypeID,
      });

      if (!roomType) {
        throw new NotFoundException('Room type not found');
      }

      room.RoomType = roomType;
    }

    if (data.RoomNumber !== undefined) {
      const roomNumber = data.RoomNumber.trim();

      if (!roomNumber) {
        throw new BadRequestException('Room number cannot be empty');
      }

      const existingRoom = await this.roomRepository.findOneBy({
        RoomNumber: roomNumber,
      });

      if (existingRoom && existingRoom.RoomID !== id) {
        throw new ConflictException('Room number already exists');
      }

      room.RoomNumber = roomNumber;
    }

    if (data.PricePerNight !== undefined) {
      this.validatePrice(data.PricePerNight);
      room.PricePerNight = data.PricePerNight;
    }

    if (data.Status !== undefined) {
      this.validateStatus(data.Status);
      room.Status = data.Status;
    }

    return this.roomRepository.save(room);
  }

  async remove(id: number) {
    const room = await this.findOne(id);

    const reservation = await this.reservationRepository
      .createQueryBuilder('reservation')
      .innerJoin('reservation.Room', 'room')
      .where('room.RoomID = :id', { id })
      .getOne();

    if (reservation) {
      throw new ConflictException(
        'Cannot delete room because it has existing reservations',
      );
    }

    await this.roomRepository.remove(room);

    return {
      message: 'Room deleted successfully',
    };
  }
}
