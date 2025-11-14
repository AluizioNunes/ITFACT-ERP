import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type NoteDocument = HydratedDocument<Note>

@Schema({ timestamps: true })
export class Note {
  @Prop({ required: true })
  title: string

  @Prop()
  content?: string

  @Prop({ type: [String], default: [] })
  tags?: string[]

  @Prop()
  clientId?: number
}

export const NoteSchema = SchemaFactory.createForClass(Note)