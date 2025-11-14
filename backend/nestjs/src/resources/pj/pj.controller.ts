import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe } from '@nestjs/common'
import { PJService } from './pj.service'
import { PessoaJuridica } from '../../entities/pessoa-juridica.entity'

@Controller('api/clients/pj')
export class PJController {
  constructor(private readonly service: PJService) {}

  @Post()
  create(@Body() body: Partial<PessoaJuridica>) {
    return this.service.create(body)
  }

  @Get()
  findAll() {
    return this.service.findAll()
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id)
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: Partial<PessoaJuridica>) {
    return this.service.update(id, body)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id)
  }
}