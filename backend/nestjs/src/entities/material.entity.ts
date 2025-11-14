import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('materials')
export class Material {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 120 })
  name: string;

  @Column({ length: 60, unique: true })
  sku: string;

  @Column('decimal', { precision: 12, scale: 2 })
  unitPrice: number;

  @Column('int', { default: 0 })
  stockQuantity: number;

  @CreateDateColumn()
  createdAt: Date;
}