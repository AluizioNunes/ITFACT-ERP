export type ID = string | number

export interface Client {
  id?: number
  name: string
  email?: string
  phone?: string
}

// Pessoas
export interface PessoaFisica {
  idPF?: number
  cpf: string
  nome: string
  endereco: string
  complemento?: string
  bairro: string
  cep: string
  cidade: string
  uf: string
  celular?: string
  whatsapp?: string
  email: string
}

export interface PessoaJuridica {
  idPJ?: number
  cnpj: string
  razaoSocial: string
  nomeFantasia?: string
  endereco: string
  complemento?: string
  bairro: string
  cep: string
  cidade: string
  uf: string
  telefone?: string
  email: string
  representante?: string
  celular?: string
  whatsapp?: string
}

export type ClientListItem = {
  tipo: 'PF' | 'PJ'
  id: number
  nome: string
  documento: string
  email?: string
  telefone?: string
}

export interface Material {
  id?: number
  name: string
  sku?: string
  unitPrice: number
  stockQuantity: number
}

// Formulário estendido para Entrada de Material (frontend)
export interface MaterialEntryForm extends Material {
  description?: string
  category?: string
  manufacturer?: string
  origin?: string
  model?: string
  purchaseUnitPrice?: number
  supplierCode?: string
  internalCode?: string
  aisle?: string
  shelf?: string
  position?: string
  minStock?: number
  maxStock?: number
  unit?: string
  margin?: number
  supplierName?: string
  leadTimeDays?: number
  barcode?: string
  expirationDate?: string
  lotNumber?: string
  weight?: number
  height?: number
  width?: number
  depth?: number
}

export interface ServiceEntity {
  id?: number
  name: string
  description?: string
  hourlyRate: number
}

export interface BudgetItemMaterial {
  id?: number
  materialId: number
  quantity: number
}

export interface BudgetItemService {
  id?: number
  serviceId: number
  hours: number
}

export interface Budget {
  id?: number
  clientId: number
  materials: BudgetItemMaterial[]
  services: BudgetItemService[]
}

export interface Lead {
  id?: string
  _id?: string
  name: string
  email?: string
  phone?: string
  status?: 'new' | 'contacted' | 'qualified' | 'won' | 'lost'
}

export interface Activity {
  id?: string
  leadId: string
  type: 'note' | 'call' | 'meeting' | 'email'
  notes?: string
  created_at?: string
}

export interface Supplier {
  id?: number
  name: string
  email?: string
  phone?: string
  type: 'MATERIAL' | 'SERVICO'
}