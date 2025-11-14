import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Budget } from '../../entities/budget.entity';
import { BudgetItemMaterial } from '../../entities/budget-item-material.entity';
import { BudgetItemService } from '../../entities/budget-item-service.entity';
import { BudgetsService } from './budgets.service';
import { BudgetsController } from './budgets.controller';
import { Material } from '../../entities/material.entity';
import { ServiceEntity } from '../../entities/service.entity';
import { Client } from '../../entities/client.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Budget,
      BudgetItemMaterial,
      BudgetItemService,
      Material,
      ServiceEntity,
      Client,
    ]),
  ],
  providers: [BudgetsService],
  controllers: [BudgetsController],
})
export class BudgetsModule {}