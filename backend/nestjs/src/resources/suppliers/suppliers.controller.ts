import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe } from '@nestjs/common'
import { SuppliersService } from './suppliers.service'
import { Supplier } from '../../entities/supplier.entity'

@Controller('api/suppliers')
export class SuppliersController {
  constructor(private readonly service: SuppliersService) {}

  @Post()
  create(@Body() body: Partial<Supplier>) {
    return this.service.create(body)
  }

  @Get()
  findAll() {
    return this.service.findAll()
  }

  // Place static route before dynamic ":id" to avoid matching "stats" as an id
  @Get('stats')
  stats() {
    return this.service.stats()
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id)
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: Partial<Supplier>) {
    return this.service.update(id, body)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id)
  }
}