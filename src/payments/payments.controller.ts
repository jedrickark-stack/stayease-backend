
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
} from '@nestjs/common';

import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/v1/payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
  ) {}

  @Post()
  create(@Body() data: {
    ReservationID: number;
    Amount: number;
    PaymentMethod: string;
  }, @Req() req: any) {
    return this.paymentsService.create(
      data,
      req.user.sub,
      req.user.role,
    );
  }

  @Get()
  findAll(@Req() req: any) {
    return this.paymentsService.findAll(
      req.user.sub,
      req.user.role,
    );
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    return this.paymentsService.findOne(
      id,
      req.user.sub,
      req.user.role,
    );
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: {
      ReservationID?: number;
      Amount?: number;
      PaymentMethod?: string;
      PaymentStatus?: 'Pending' | 'Paid' | 'Failed';
    },
    @Req() req: any,
  ) {
    return this.paymentsService.update(
      id,
      data,
      req.user.sub,
      req.user.role,
    );
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    return this.paymentsService.remove(
      id,
      req.user.sub,
      req.user.role,
    );
  }
}
