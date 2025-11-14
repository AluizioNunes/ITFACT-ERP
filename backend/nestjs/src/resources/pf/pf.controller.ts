import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe } from '@nestjs/common'
import { PFService } from './pf.service'
import { PessoaFisica } from '../../entities/pessoa-fisica.entity'

@Controller('api/clients/pf')
export class PFController {
  constructor(private readonly service: PFService) {}

  @Post()
  create(@Body() body: Partial<PessoaFisica>) {
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
  update(@Param('id', ParseIntPipe) id: number, @Body() body: Partial<PessoaFisica>) {
    return this.service.update(id, body)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id)
  }
}