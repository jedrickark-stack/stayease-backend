
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Reservation } from '../entities/reservation.entity';
import { User } from '../entities/user.entity';
import { Room } from '../entities/room.entity';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}

  private validateDate(date: string, field: string) {
    if (
      typeof date !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date)
    ) {
      throw new BadRequestException(`Invalid ${field} date format`);
    }

    const parsed = new Date(`${date}T00:00:00.000Z`);

    if (
      isNaN(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== date
    ) {
      throw new BadRequestException(`Invalid ${field} date`);
    }
  }

  async create(data: {
    UserID: number;
    RoomID: number;
    CheckInDate: string;
    CheckOutDate: string;
  }) {
    this.validateDate(data.CheckInDate, 'check-in');
    this.validateDate(data.CheckOutDate, 'check-out');

    if (data.CheckOutDate <= data.CheckInDate) {
      throw new BadRequestException(
        'Check-out date must be after check-in date',
      );
    }

    const user = await this.userRepository.findOneBy({
      UserID: data.UserID,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const room = await this.roomRepository.findOneBy({
      RoomID: data.RoomID,
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.Status !== 'Available') {
      throw new BadRequestException('Room is unavailable');
    }

    await this.checkRoomAvailability(
      data.RoomID,
      data.CheckInDate,
      data.CheckOutDate,
    );

    const reservation = this.reservationRepository.create({
      User: user,
      Room: room,
      CheckInDate: data.CheckInDate,
      CheckOutDate: data.CheckOutDate,
      ReservationStatus: 'Pending',
    });

    return this.reservationRepository.save(reservation);
  }

  findAll(userId: number, role: string) {
    const where =
      role === 'Admin'
        ? {}
        : { User: { UserID: userId } };

    return this.reservationRepository.find({
      where,
      relations: {
        User: true,
        Room: {
          RoomType: true,
        },
      },
    });
  }

  async findOne(id: number, userId: number, role: string) {
    const reservation = await this.reservationRepository.findOne({
      where: { ReservationID: id },
      relations: {
        User: true,
        Room: {
          RoomType: true,
        },
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    if (
      role !== 'Admin' &&
      reservation.User.UserID !== userId
    ) {
      throw new ForbiddenException(
        'You can only access your own reservations',
      );
    }

    return reservation;
  }

  async update(
    id: number,
    userId: number,
    role: string,
    data: {
      CheckInDate?: string;
      CheckOutDate?: string;
      ReservationStatus?: 'Pending' | 'Confirmed' | 'Cancelled';
    },
  ) {
    const reservation = await this.findOne(id, userId, role);

    if (reservation.ReservationStatus === 'Cancelled') {
      throw new BadRequestException(
        'Cancelled reservations cannot be updated',
      );
    }

    if (
      data.ReservationStatus !== undefined &&
      !['Pending', 'Confirmed', 'Cancelled'].includes(
        data.ReservationStatus,
      )
    ) {
      throw new BadRequestException('Invalid reservation status');
    }

    if (
      role !== 'Admin' &&
      data.ReservationStatus !== undefined &&
      data.ReservationStatus !== 'Cancelled'
    ) {
      throw new ForbiddenException(
        'Guests can only cancel their reservations',
      );
    }

    const checkIn =
      data.CheckInDate ?? reservation.CheckInDate;

    const checkOut =
      data.CheckOutDate ?? reservation.CheckOutDate;

    if (data.CheckInDate !== undefined) {
      this.validateDate(data.CheckInDate, 'check-in');
    }

    if (data.CheckOutDate !== undefined) {
      this.validateDate(data.CheckOutDate, 'check-out');
    }

    if (checkOut <= checkIn) {
      throw new BadRequestException(
        'Check-out date must be after check-in date',
      );
    }

    const datesChanged =
      data.CheckInDate !== undefined ||
      data.CheckOutDate !== undefined;

    const reactivatingReservation =
      data.ReservationStatus !== undefined &&
      data.ReservationStatus !== 'Cancelled' &&
      reservation.ReservationStatus === 'Cancelled';

    if (datesChanged || reactivatingReservation) {
      await this.checkRoomAvailability(
        reservation.Room.RoomID,
        checkIn,
        checkOut,
        reservation.ReservationID,
      );
    }

    if (data.CheckInDate !== undefined) {
      reservation.CheckInDate = data.CheckInDate;
    }

    if (data.CheckOutDate !== undefined) {
      reservation.CheckOutDate = data.CheckOutDate;
    }

    if (data.ReservationStatus !== undefined) {
      reservation.ReservationStatus = data.ReservationStatus;
    }

    return this.reservationRepository.save(reservation);
  }

  async remove(id: number, userId: number, role: string) {
    if (role !== 'Admin') {
      throw new ForbiddenException(
        'Only Admin can delete reservations',
      );
    }

    const reservation = await this.findOne(id, userId, role);

    await this.reservationRepository.remove(reservation);

    return {
      message: 'Reservation deleted successfully',
    };
  }

  private async checkRoomAvailability(
    roomId: number,
    checkIn: string,
    checkOut: string,
    excludeReservationId?: number,
  ) {
    const query = this.reservationRepository
      .createQueryBuilder('reservation')
      .leftJoin('reservation.Room', 'room')
      .where('room.RoomID = :roomId', { roomId })
      .andWhere('reservation.ReservationStatus != :cancelled', {
        cancelled: 'Cancelled',
      })
      .andWhere('reservation.CheckInDate < :checkOut', {
        checkOut,
      })
      .andWhere('reservation.CheckOutDate > :checkIn', {
        checkIn,
      });

    if (excludeReservationId !== undefined) {
      query.andWhere('reservation.ReservationID != :id', {
        id: excludeReservationId,
      });
    }

    const overlapping = await query.getOne();

    if (overlapping) {
      throw new BadRequestException(
        'Room is already reserved for these dates',
      );
    }
  }
}

