
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';

import { Request } from 'express';
import { ReservationsService } from './reservations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

type AuthenticatedRequest = Request & {
  user: {
    sub: number;
    email: string;
    role: string;
  };
};

@Controller('api/v1/reservations')
@UseGuards(JwtAuthGuard)
export class ReservationsController {
  constructor(
    private readonly reservationsService: ReservationsService,
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

    return parsed;
  }

  @Post()
  create(
    @Req() req: AuthenticatedRequest,
    @Body()
    data: {
      RoomID: number;
      CheckInDate: string;
      CheckOutDate: string;
    },
  ) {
    if (
      !Number.isInteger(Number(data.RoomID)) ||
      Number(data.RoomID) <= 0
    ) {
      throw new BadRequestException('Valid RoomID is required');
    }

    if (!data.CheckInDate || !data.CheckOutDate) {
      throw new BadRequestException(
        'Check-in and check-out dates are required',
      );
    }

    const checkIn = this.validateDate(
      data.CheckInDate,
      'check-in',
    );

    const checkOut = this.validateDate(
      data.CheckOutDate,
      'check-out',
    );

    if (checkOut <= checkIn) {
      throw new BadRequestException(
        'Check-out date must be after check-in date',
      );
    }

    return this.reservationsService.create({
      UserID: req.user.sub,
      RoomID: Number(data.RoomID),
      CheckInDate: data.CheckInDate,
      CheckOutDate: data.CheckOutDate,
    });
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.reservationsService.findAll(
      req.user.sub,
      req.user.role,
    );
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.reservationsService.findOne(
      id,
      req.user.sub,
      req.user.role,
    );
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
    @Body()
    data: {
      CheckInDate?: string;
      CheckOutDate?: string;
      ReservationStatus?: 'Pending' | 'Confirmed' | 'Cancelled';
    },
  ) {
    if (!data || Object.keys(data).length === 0) {
      throw new BadRequestException(
        'At least one field is required for update',
      );
    }

    if (data.CheckInDate !== undefined) {
      this.validateDate(data.CheckInDate, 'check-in');
    }

    if (data.CheckOutDate !== undefined) {
      this.validateDate(data.CheckOutDate, 'check-out');
    }

    if (
      data.ReservationStatus !== undefined &&
      !['Pending', 'Confirmed', 'Cancelled'].includes(
        data.ReservationStatus,
      )
    ) {
      throw new BadRequestException(
        'Invalid reservation status',
      );
    }

    return this.reservationsService.update(
      id,
      req.user.sub,
      req.user.role,
      data,
    );
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.reservationsService.remove(
      id,
      req.user.sub,
      req.user.role,
    );
  }
}
