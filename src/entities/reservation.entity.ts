
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';

import { User } from './user.entity';
import { Room } from './room.entity';

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn()
  ReservationID: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'UserID' })
  User: User;

  @ManyToOne(() => Room, { nullable: false })
  @JoinColumn({ name: 'RoomID' })
  Room: Room;

  @Column({ type: 'date' })
  CheckInDate: string;

  @Column({ type: 'date' })
  CheckOutDate: string;

  @Column({
    type: 'enum',
    enum: ['Pending', 'Confirmed', 'Cancelled'],
    default: 'Pending',
  })
  ReservationStatus: string;

  @CreateDateColumn()
  CreatedAt: Date;
}

