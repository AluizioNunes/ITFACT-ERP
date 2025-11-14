import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Supplier } from '../../entities/supplier.entity'

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private repo: Repository<Supplier>,
  ) {}

  create(data: Partial<Supplier>) {
    const entity = this.repo.create(data)
    return this.repo.save(entity)
  }

  findAll() {
    return this.repo.find({ order: { id: 'DESC' } })
  }

  async findOne(id: number) {
    const entity = await this.repo.findOneBy({ id })
    if (!entity) throw new NotFoundException(`Fornecedor ${id} não encontrado`)
    return entity
  }

  async update(id: number, data: Partial<Supplier>) {
    await this.repo.update(id, data)
    return this.findOne(id)
  }

  async remove(id: number) {
    await this.repo.delete(id)
    return { deleted: true }
  }

  async stats(): Promise<{ materials: number; services: number; total: number }> {
    const materials = await this.repo.count({ where: { type: 'MATERIAL' } })
    const services = await this.repo.count({ where: { type: 'SERVICO' } })
    return { materials, services, total: materials + services }
  }
}