import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common'
import { NotesService } from './notes.service'

@Controller('/api/notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  create(@Body() payload: any) {
    return this.notesService.create(payload)
  }

  @Get()
  findAll(@Query('clientId') clientId?: string, @Query('tags') tags?: string) {
    const filter = {
      clientId: clientId !== undefined ? Number(clientId) : undefined,
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
    }
    return this.notesService.findAll(filter)
  }

  @Get('count')
  count(@Query('clientId') clientId?: string, @Query('tags') tags?: string) {
    const filter = {
      clientId: clientId !== undefined ? Number(clientId) : undefined,
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
    }
    return this.notesService.count(filter)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.notesService.findOne(id)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() payload: any) {
    return this.notesService.update(id, payload)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notesService.remove(id)
  }
}