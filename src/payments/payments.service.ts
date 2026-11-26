
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Payment } from '../entities/payment.entity';
import { Reservation } from '../entities/reservation.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,

    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
  ) {}

  private isAdmin(role: string): boolean {
    return role === 'Admin';
  }

  private async checkOwnership(
    reservationID: number,
    userID: number,
    role: string,
  ) {
    const reservation = await this.reservationRepository.findOne({
      where: { ReservationID: reservationID },
      relations: { User: true },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    if (!this.isAdmin(role) && reservation.User.UserID !== userID) {
      throw new ForbiddenException('You cannot access this reservation');
    }

    return reservation;
  }

  async create(
    data: {
      ReservationID: number;
      Amount: number;
      PaymentMethod: string;
    },
    userID: number,
    role: string,
  ) {
    if (!Number.isFinite(Number(data.Amount)) || Number(data.Amount) <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    if (!data.PaymentMethod?.trim()) {
      throw new BadRequestException('Payment method is required');
    }

    const reservation = await this.checkOwnership(
      data.ReservationID,
      userID,
      role,
    );

    const payment = this.paymentRepository.create({
      Reservation: reservation,
      Amount: data.Amount,
      PaymentMethod: data.PaymentMethod.trim(),
      PaymentStatus: 'Pending',
      PaymentDate: null,
    });

    return this.paymentRepository.save(payment);
  }

  async findAll(userID: number, role: string) {
    const payments = await this.paymentRepository.find({
      relations: {
        Reservation: {
          User: true,
        },
      },
    });

    if (this.isAdmin(role)) {
      return payments;
    }

    return payments.filter(
      (payment) => payment.Reservation.User.UserID === userID,
    );
  }

  async findOne(id: number, userID: number, role: string) {
    const payment = await this.paymentRepository.findOne({
      where: { PaymentID: id },
      relations: {
        Reservation: {
          User: true,
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (
      !this.isAdmin(role) &&
      payment.Reservation.User.UserID !== userID
    ) {
      throw new ForbiddenException('You cannot access this payment');
    }

    return payment;
  }

  async update(
    id: number,
    data: {
      ReservationID?: number;
      Amount?: number;
      PaymentMethod?: string;
      PaymentStatus?: 'Pending' | 'Paid' | 'Failed';
    },
    userID: number,
    role: string,
  ) {
    const payment = await this.findOne(id, userID, role);

    if (!this.isAdmin(role) && data.PaymentStatus !== undefined) {
      throw new ForbiddenException('Only Admin can update payment status');
    }

    if (data.ReservationID !== undefined) {
      const reservation = await this.checkOwnership(
        data.ReservationID,
        userID,
        role,
      );

      payment.Reservation = reservation;
    }

    if (data.Amount !== undefined) {
      if (!Number.isFinite(Number(data.Amount)) || Number(data.Amount) <= 0) {
        throw new BadRequestException('Amount must be greater than zero');
      }

      payment.Amount = data.Amount;
    }

    if (data.PaymentMethod !== undefined) {
      if (!data.PaymentMethod.trim()) {
        throw new BadRequestException('Payment method is required');
      }

      payment.PaymentMethod = data.PaymentMethod.trim();
    }

    if (data.PaymentStatus !== undefined) {
      payment.PaymentStatus = data.PaymentStatus;
      payment.PaymentDate =
        data.PaymentStatus === 'Paid' ? new Date() : null;
    }

    return this.paymentRepository.save(payment);
  }

  async remove(id: number, userID: number, role: string) {
    const payment = await this.findOne(id, userID, role);

    await this.paymentRepository.remove(payment);

    return {
      message: 'Payment deleted successfully',
    };
  }
}
