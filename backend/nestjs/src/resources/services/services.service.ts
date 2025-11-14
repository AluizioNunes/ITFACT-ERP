import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceEntity } from '../../entities/service.entity';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(ServiceEntity)
    private repo: Repository<ServiceEntity>,
  ) {}

  create(data: Partial<ServiceEntity>) {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  findAll() {
    return this.repo.find({ order: { id: 'DESC' } });
  }

  async findOne(id: number) {
    const entity = await this.repo.findOneBy({ id });
    if (!entity) throw new NotFoundException(`Serviço ${id} não encontrado`);
    return entity;
  }

  async update(id: number, data: Partial<ServiceEntity>) {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.repo.delete(id);
    return { deleted: true };
  }
}