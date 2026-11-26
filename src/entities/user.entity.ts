
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  UserID: number;

  @Column({ length: 100 })
  FullName: string;

  @Column({ unique: true, length: 100 })
  Email: string;

  @Column({ select: false })
  PasswordHash: string;

  @Column({ type: 'enum', enum: ['Guest', 'Admin'], default: 'Guest' })
  Role: string;

  @CreateDateColumn()
  CreatedAt: Date;
}
