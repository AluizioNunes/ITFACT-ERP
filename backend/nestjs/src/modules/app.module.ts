import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { Client } from '../entities/client.entity';
import { Material } from '../entities/material.entity';
import { ServiceEntity } from '../entities/service.entity';
import { Budget } from '../entities/budget.entity';
import { BudgetItemMaterial } from '../entities/budget-item-material.entity';
import { BudgetItemService } from '../entities/budget-item-service.entity';
import { PessoaFisica } from '../entities/pessoa-fisica.entity';
import { PessoaJuridica } from '../entities/pessoa-juridica.entity';
import { ClientsModule } from '../resources/clients/clients.module';
import { MaterialsModule } from '../resources/materials/materials.module';
import { ServicesModule } from '../resources/services/services.module';
import { BudgetsModule } from '../resources/budgets/budgets.module';
import { PFModule } from '../resources/pf/pf.module';
import { PJModule } from '../resources/pj/pj.module';
import { NotesModule } from '../resources/notes/notes.module';
import { Supplier } from '../entities/supplier.entity';
import { SuppliersModule } from '../resources/suppliers/suppliers.module';

@Module({
  imports: [
    CacheModule.register(),
    // MongoDB connection for non-relational data (NestJS)
    MongooseModule.forRoot(
      process.env.MONGO_URL || 'mongodb://localhost:27017',
      {
        dbName: process.env.MONGO_DB || 'erp',
      },
    ),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST || 'localhost',
      port: Number(process.env.POSTGRES_PORT) || 5432,
      username: process.env.POSTGRES_USER || 'erp',
      password: process.env.POSTGRES_PASSWORD || 'erp123',
      database: process.env.POSTGRES_DB || 'erpdb',
      synchronize: true,
      logging: false,
      entities: [
        Client,
        Material,
        ServiceEntity,
        Budget,
        BudgetItemMaterial,
        BudgetItemService,
        PessoaFisica,
        PessoaJuridica,
        Supplier,
      ],
    }),
    ClientsModule,
    MaterialsModule,
    ServicesModule,
    BudgetsModule,
    PFModule,
    PJModule,
    NotesModule,
    SuppliersModule,
  ],
})
export class AppModule {}