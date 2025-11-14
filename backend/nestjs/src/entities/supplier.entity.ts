import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm'

export type SupplierType = 'MATERIAL' | 'SERVICO'

@Entity('suppliers')
export class Supplier {
  @PrimaryGeneratedColumn()
  id: number

  @Index('supplier_name_unique', { unique: true })
  @Column({ length: 120 })
  name: string

  @Column({ length: 120, nullable: true })
  email?: string

  @Column({ length: 40, nullable: true })
  phone?: string

  @Index('supplier_type_idx')
  @Column({ type: 'enum', enum: ['MATERIAL', 'SERVICO'], default: 'MATERIAL' })
  type: SupplierType

  @CreateDateColumn()
  createdAt: Date
}