
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Reservation } from './reservation.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  PaymentID: number;

  @ManyToOne(() => Reservation, { nullable: false })
  @JoinColumn({ name: 'ReservationID' })
  Reservation: Reservation;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  Amount: number;

  @Column({ length: 50 })
  PaymentMethod: string;

  @Column({
    type: 'enum',
    enum: ['Pending', 'Paid', 'Failed'],
    default: 'Pending',
  })
  PaymentStatus: string;

  @Column({ type: 'datetime', nullable: true })
  PaymentDate: Date | null;
}
