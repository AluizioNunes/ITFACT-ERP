import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Note, NoteDocument } from './note.schema'

@Injectable()
export class NotesService {
  constructor(@InjectModel(Note.name) private readonly noteModel: Model<NoteDocument>) {}

  async create(payload: Partial<Note>): Promise<Note> {
    const note = new this.noteModel(payload)
    return note.save()
  }

  async findAll(filter?: { clientId?: number; tags?: string[] }): Promise<Note[]> {
    const query: Record<string, any> = {}
    if (filter?.clientId !== undefined) {
      query.clientId = filter.clientId
    }
    if (filter?.tags && filter.tags.length > 0) {
      query.tags = { $all: filter.tags }
    }
    return this.noteModel.find(query).sort({ _id: -1 }).lean().exec()
  }

  async count(filter?: { clientId?: number; tags?: string[] }): Promise<{ count: number }> {
    const query: Record<string, any> = {}
    if (filter?.clientId !== undefined) {
      query.clientId = filter.clientId
    }
    if (filter?.tags && filter.tags.length > 0) {
      query.tags = { $all: filter.tags }
    }
    const total = await this.noteModel.countDocuments(query).exec()
    return { count: total }
  }

  async findOne(id: string): Promise<Note> {
    const note = await this.noteModel.findById(id).lean().exec()
    if (!note) throw new NotFoundException('Note not found')
    return note as any
  }

  async update(id: string, payload: Partial<Note>): Promise<Note> {
    const note = await this.noteModel.findByIdAndUpdate(id, payload, { new: true }).lean().exec()
    if (!note) throw new NotFoundException('Note not found')
    return note as any
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const res = await this.noteModel.findByIdAndDelete(id).exec()
    if (!res) throw new NotFoundException('Note not found')
    return { deleted: true }
  }
}