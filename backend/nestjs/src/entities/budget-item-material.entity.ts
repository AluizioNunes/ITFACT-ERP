import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Material } from './material.entity';
import { Budget } from './budget.entity';

@Entity('budget_item_materials')
export class BudgetItemMaterial {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Budget, (budget) => budget.materials)
  budget: Budget;

  @ManyToOne(() => Material, { eager: true })
  material: Material;

  @Column('int')
  quantity: number;

  @Column('decimal', { precision: 12, scale: 2 })
  unitPrice: number;
}