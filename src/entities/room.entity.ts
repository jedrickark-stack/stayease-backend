
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { RoomType } from './room-type.entity';

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn()
  RoomID: number;

  @Column({ unique: true, length: 20 })
  RoomNumber: string;

  @ManyToOne(() => RoomType, { nullable: false })
  @JoinColumn({ name: 'RoomTypeID' })
  RoomType: RoomType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  PricePerNight: number;

  @Column({ type: 'enum', enum: ['Available', 'Unavailable'], default: 'Available' })
  Status: string;
}
