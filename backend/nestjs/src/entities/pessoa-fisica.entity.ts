import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, BeforeInsert, BeforeUpdate } from 'typeorm'

@Entity('PessoaFisica')
export class PessoaFisica {
  @PrimaryGeneratedColumn({ name: 'IdPF' })
  idPF: number

  @Column({ name: 'CPF', length: 14, unique: true })
  cpf: string

  @Column({ name: 'Nome', length: 160 })
  nome: string

  @Column({ name: 'Endereco', length: 160 })
  endereco: string

  @Column({ name: 'Complemento', length: 120, nullable: true })
  complemento?: string

  @Column({ name: 'Bairro', length: 120 })
  bairro: string

  @Column({ name: 'CEP', length: 10 })
  cep: string

  @Column({ name: 'Cidade', length: 120 })
  cidade: string

  @Column({ name: 'UF', length: 2 })
  uf: string

  @Column({ name: 'Celular', length: 15, nullable: true })
  celular?: string

  @Column({ name: 'Whatsapp', length: 15, nullable: true })
  whatsapp?: string

  @Column({ name: 'Email', length: 160 })
  email: string

  @CreateDateColumn({ name: 'CreatedAt' })
  createdAt: Date

  @BeforeInsert()
  @BeforeUpdate()
  normalizeCase(): void {
    this.nome = this.nome?.toUpperCase() || this.nome
    this.endereco = this.endereco?.toUpperCase() || this.endereco
    this.complemento = this.complemento?.toUpperCase() || this.complemento
    this.bairro = this.bairro?.toUpperCase() || this.bairro
    this.cidade = this.cidade?.toUpperCase() || this.cidade
    this.uf = this.uf?.toUpperCase() || this.uf
    this.email = this.email?.toLowerCase() || this.email
  }
}