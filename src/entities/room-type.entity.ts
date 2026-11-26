
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('room_types')
export class RoomType {
  @PrimaryGeneratedColumn()
  RoomTypeID: number;

  @Column({ unique: true, length: 50 })
  TypeName: string;

  @Column({ type: 'text', nullable: true })
  Description: string;

  @Column({ type: 'int' })
  Capacity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  BasePrice: number;
}
