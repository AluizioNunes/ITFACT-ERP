import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Budget } from '../../entities/budget.entity';
import { BudgetItemMaterial } from '../../entities/budget-item-material.entity';
import { BudgetItemService } from '../../entities/budget-item-service.entity';
import { Material } from '../../entities/material.entity';
import { ServiceEntity } from '../../entities/service.entity';
import { Client } from '../../entities/client.entity';

type CreateBudgetDTO = {
  number: string;
  clientId: number;
  materials?: { materialId: number; quantity: number; unitPrice?: number }[];
  services?: { serviceId: number; hours: number; unitPrice?: number }[];
};

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget) private budgetsRepo: Repository<Budget>,
    @InjectRepository(BudgetItemMaterial) private bimRepo: Repository<BudgetItemMaterial>,
    @InjectRepository(BudgetItemService) private bisRepo: Repository<BudgetItemService>,
    @InjectRepository(Material) private materialsRepo: Repository<Material>,
    @InjectRepository(ServiceEntity) private servicesRepo: Repository<ServiceEntity>,
    @InjectRepository(Client) private clientsRepo: Repository<Client>,
  ) {}

  async create(dto: CreateBudgetDTO) {
    const client = await this.clientsRepo.findOneBy({ id: dto.clientId });
    if (!client) throw new Error('Client not found');

    const budget = this.budgetsRepo.create({ number: dto.number, client, total: 0 });
    const saved = await this.budgetsRepo.save(budget);

    let total = 0;

    if (dto.materials && dto.materials.length) {
      for (const item of dto.materials) {
        const material = await this.materialsRepo.findOneBy({ id: item.materialId });
        if (!material) throw new Error('Material not found');
        const unitPrice = item.unitPrice ?? Number(material.unitPrice);
        total += unitPrice * item.quantity;
        const bim = this.bimRepo.create({ budget: saved, material, quantity: item.quantity, unitPrice });
        await this.bimRepo.save(bim);
      }
    }

    if (dto.services && dto.services.length) {
      for (const item of dto.services) {
        const service = await this.servicesRepo.findOneBy({ id: item.serviceId });
        if (!service) throw new Error('Service not found');
        const unitPrice = item.unitPrice ?? Number(service.hourlyRate);
        total += unitPrice * item.hours;
        const bis = this.bisRepo.create({ budget: saved, service, hours: item.hours, unitPrice });
        await this.bisRepo.save(bis);
      }
    }

    saved.total = total;
    await this.budgetsRepo.save(saved);
    return this.findOne(saved.id);
  }

  findAll() {
    return this.budgetsRepo.find({ order: { id: 'DESC' }, relations: ['materials', 'services'] });
  }

  async findOne(id: number) {
    const entity = await this.budgetsRepo.findOne({ where: { id }, relations: ['materials', 'services'] });
    if (!entity) throw new NotFoundException(`Orçamento ${id} não encontrado`);
    return entity;
  }

  async remove(id: number) {
    await this.bimRepo.delete({ budget: { id } as any });
    await this.bisRepo.delete({ budget: { id } as any });
    await this.budgetsRepo.delete(id);
    return { deleted: true };
  }

  async update(id: number, dto: CreateBudgetDTO) {
    const existing = await this.budgetsRepo.findOne({ where: { id } });
    if (!existing) throw new Error('Budget not found');

    const client = await this.clientsRepo.findOneBy({ id: dto.clientId });
    if (!client) throw new Error('Client not found');

    existing.number = dto.number;
    existing.client = client;
    existing.total = 0;
    await this.budgetsRepo.save(existing);

    await this.bimRepo.delete({ budget: { id } as any });
    await this.bisRepo.delete({ budget: { id } as any });

    let total = 0;

    if (dto.materials && dto.materials.length) {
      for (const item of dto.materials) {
        const material = await this.materialsRepo.findOneBy({ id: item.materialId });
        if (!material) throw new Error('Material not found');
        const unitPrice = item.unitPrice ?? Number(material.unitPrice);
        total += unitPrice * item.quantity;
        const bim = this.bimRepo.create({ budget: existing, material, quantity: item.quantity, unitPrice });
        await this.bimRepo.save(bim);
      }
    }

    if (dto.services && dto.services.length) {
      for (const item of dto.services) {
        const service = await this.servicesRepo.findOneBy({ id: item.serviceId });
        if (!service) throw new Error('Service not found');
        const unitPrice = item.unitPrice ?? Number(service.hourlyRate);
        total += unitPrice * item.hours;
        const bis = this.bisRepo.create({ budget: existing, service, hours: item.hours, unitPrice });
        await this.bisRepo.save(bis);
      }
    }

    existing.total = total;
    await this.budgetsRepo.save(existing);
    return this.findOne(existing.id);
  }
}