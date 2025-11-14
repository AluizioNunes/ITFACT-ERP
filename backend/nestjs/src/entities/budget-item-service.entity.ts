import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { ServiceEntity } from './service.entity';
import { Budget } from './budget.entity';

@Entity('budget_item_services')
export class BudgetItemService {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Budget, (budget) => budget.services)
  budget: Budget;

  @ManyToOne(() => ServiceEntity, { eager: true })
  service: ServiceEntity;

  @Column('decimal', { precision: 12, scale: 2 })
  hours: number;

  @Column('decimal', { precision: 12, scale: 2 })
  unitPrice: number;
}