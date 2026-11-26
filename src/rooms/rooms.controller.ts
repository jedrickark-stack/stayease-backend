
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
  ForbiddenException,
  Req,
} from '@nestjs/common';

import { RoomsService } from './rooms.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/v1/rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  private checkAdmin(req: any) {
    if (req.user.role !== 'Admin') {
      throw new ForbiddenException('Only Admin can manage rooms');
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body()
    data: {
      RoomNumber: string;
      RoomTypeID: number;
      PricePerNight: number;
      Status?: 'Available' | 'Unavailable';
    },
    @Req() req: any,
  ) {
    this.checkAdmin(req);
    return this.roomsService.create(data);
  }

  @Get()
  findAll() {
    return this.roomsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.roomsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    data: {
      RoomNumber?: string;
      RoomTypeID?: number;
      PricePerNight?: number;
      Status?: 'Available' | 'Unavailable';
    },
    @Req() req: any,
  ) {
    this.checkAdmin(req);
    return this.roomsService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    this.checkAdmin(req);
    return this.roomsService.remove(id);
  }
}
