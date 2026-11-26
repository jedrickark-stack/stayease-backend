
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

import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/v1/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  private checkAdmin(req: any) {
    if (req.user.role !== 'Admin') {
      throw new ForbiddenException('Only Admin can manage users');
    }
  }

  @Get()
  findAll(@Req() req: any) {
    this.checkAdmin(req);
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    this.checkAdmin(req);
    return this.usersService.findOne(id);
  }

  @Post()
  create(@Body() body: any, @Req() req: any) {
    this.checkAdmin(req);
    return this.usersService.create(body);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @Req() req: any,
  ) {
    this.checkAdmin(req);
    return this.usersService.update(id, body);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    this.checkAdmin(req);
    return this.usersService.remove(id, req.user.sub);
  }
}

