
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  ForbiddenException,
  Req,
} from '@nestjs/common';

import { RoomTypesService } from './room-types.service';
import { RoomType } from '../entities/room-type.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/v1/room-types')
export class RoomTypesController {
  constructor(private readonly roomTypesService: RoomTypesService) {}

  private checkAdmin(req: any) {
    if (req.user.role !== 'Admin') {
      throw new ForbiddenException('Only Admin can manage room types');
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() data: Partial<RoomType>, @Req() req: any) {
    this.checkAdmin(req);
    return this.roomTypesService.create(data);
  }

  @Get()
  findAll() {
    return this.roomTypesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.roomTypesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<RoomType>,
    @Req() req: any,
  ) {
    this.checkAdmin(req);
    return this.roomTypesService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    this.checkAdmin(req);
    return this.roomTypesService.remove(id);
  }
}

