import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PessoaJuridica } from '../../entities/pessoa-juridica.entity'

@Injectable()
export class PJService {
  constructor(
    @InjectRepository(PessoaJuridica)
    private repo: Repository<PessoaJuridica>,
  ) {}

  create(data: Partial<PessoaJuridica>) {
    const entity = this.repo.create(data)
    return this.repo.save(entity)
  }

  findAll() {
    return this.repo.find({ order: { idPJ: 'DESC' } })
  }

  async findOne(id: number) {
    const entity = await this.repo.findOne({ where: { idPJ: id } })
    if (!entity) throw new NotFoundException(`Pessoa Jurídica ${id} não encontrada`)
    return entity
  }

  async update(id: number, data: Partial<PessoaJuridica>) {
    await this.repo.update({ idPJ: id }, data)
    return this.findOne(id)
  }

  async remove(id: number) {
    await this.repo.delete({ idPJ: id })
    return { deleted: true }
  }
}