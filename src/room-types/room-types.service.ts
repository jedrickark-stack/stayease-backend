import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoomType } from '../entities/room-type.entity';

@Injectable()
export class RoomTypesService {
  constructor(
    @InjectRepository(RoomType)
    private readonly roomTypeRepository: Repository<RoomType>,
  ) {}

  create(data: Partial<RoomType>) {
    const roomType = this.roomTypeRepository.create(data);
    return this.roomTypeRepository.save(roomType);
  }

  findAll() {
    return this.roomTypeRepository.find();
  }

  async findOne(id: number) {
    const roomType = await this.roomTypeRepository.findOneBy({
      RoomTypeID: id,
    });

    if (!roomType) {
      throw new NotFoundException('Room type not found');
    }

    return roomType;
  }

  async update(id: number, data: Partial<RoomType>) {
    const roomType = await this.findOne(id);
    Object.assign(roomType, data);
    return this.roomTypeRepository.save(roomType);
  }

  async remove(id: number) {
    const roomType = await this.findOne(id);
    await this.roomTypeRepository.remove(roomType);

    return { message: 'Room type deleted successfully' };
  }
}