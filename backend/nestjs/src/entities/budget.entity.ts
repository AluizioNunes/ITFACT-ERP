import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { Client } from './client.entity';
import { BudgetItemMaterial } from './budget-item-material.entity';
import { BudgetItemService } from './budget-item-service.entity';

@Entity('budgets')
export class Budget {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 30, unique: true })
  number: string;

  @ManyToOne(() => Client, { eager: true })
  client: Client;

  @OneToMany(() => BudgetItemMaterial, (item) => item.budget, { cascade: true })
  materials: BudgetItemMaterial[];

  @OneToMany(() => BudgetItemService, (item) => item.budget, { cascade: true })
  services: BudgetItemService[];

  @Column('decimal', { precision: 14, scale: 2, default: 0 })
  total: number;

  @CreateDateColumn()
  createdAt: Date;
}