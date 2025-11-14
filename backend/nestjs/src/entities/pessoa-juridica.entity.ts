import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, BeforeInsert, BeforeUpdate } from 'typeorm'

@Entity('PessoaJuridica')
export class PessoaJuridica {
  @PrimaryGeneratedColumn({ name: 'IdPJ' })
  idPJ: number

  @Column({ name: 'CNPJ', length: 18, unique: true })
  cnpj: string

  @Column({ name: 'RazaoSocial', length: 180 })
  razaoSocial: string

  @Column({ name: 'NomeFantasia', length: 180, nullable: true })
  nomeFantasia?: string

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

  @Column({ name: 'Telefone', length: 15, nullable: true })
  telefone?: string

  @Column({ name: 'Email', length: 160 })
  email: string

  @Column({ name: 'Representante', length: 160, nullable: true })
  representante?: string

  @Column({ name: 'Celular', length: 15, nullable: true })
  celular?: string

  @Column({ name: 'Whatsapp', length: 15, nullable: true })
  whatsapp?: string

  @CreateDateColumn({ name: 'CreatedAt' })
  createdAt: Date

  @BeforeInsert()
  @BeforeUpdate()
  normalizeCase(): void {
    this.razaoSocial = this.razaoSocial?.toUpperCase() || this.razaoSocial
    this.nomeFantasia = this.nomeFantasia?.toUpperCase() || this.nomeFantasia
    this.endereco = this.endereco?.toUpperCase() || this.endereco
    this.complemento = this.complemento?.toUpperCase() || this.complemento
    this.bairro = this.bairro?.toUpperCase() || this.bairro
    this.cidade = this.cidade?.toUpperCase() || this.cidade
    this.uf = this.uf?.toUpperCase() || this.uf
    this.representante = this.representante?.toUpperCase() || this.representante
    this.email = this.email?.toLowerCase() || this.email
  }
}