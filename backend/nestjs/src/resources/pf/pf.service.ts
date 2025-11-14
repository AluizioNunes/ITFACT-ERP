import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PessoaFisica } from '../../entities/pessoa-fisica.entity'

@Injectable()
export class PFService {
  constructor(
    @InjectRepository(PessoaFisica)
    private repo: Repository<PessoaFisica>,
  ) {}

  create(data: Partial<PessoaFisica>) {
    const entity = this.repo.create(data)
    return this.repo.save(entity)
  }

  findAll() {
    return this.repo.find({ order: { idPF: 'DESC' } })
  }

  async findOne(id: number) {
    const entity = await this.repo.findOne({ where: { idPF: id } })
    if (!entity) throw new NotFoundException(`Pessoa Física ${id} não encontrada`)
    return entity
  }

  async update(id: number, data: Partial<PessoaFisica>) {
    await this.repo.update({ idPF: id }, data)
    return this.findOne(id)
  }

  async remove(id: number) {
    await this.repo.delete({ idPF: id })
    return { deleted: true }
  }
}