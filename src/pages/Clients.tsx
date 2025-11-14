import React, { useEffect, useMemo, useState } from 'react'
import { Table, Button, Modal, Form, Input, Space, message, Radio, Row, Col, Card, Popconfirm } from 'antd'
import { nestApi } from '../api/http'
import { ClientListItem, PessoaFisica, PessoaJuridica } from '../types'

function onlyDigits(v: string): string {
  return (v || '').replace(/\D+/g, '')
}

function maskCPF(v: string): string {
  const d = onlyDigits(v).slice(0, 11)
  const p1 = d.slice(0, 3)
  const p2 = d.slice(3, 6)
  const p3 = d.slice(6, 9)
  const p4 = d.slice(9, 11)
  let out = p1
  if (p2) out += '.' + p2
  if (p3) out += '.' + p3
  if (p4) out += '-' + p4
  return out
}

function maskCNPJ(v: string): string {
  const d = onlyDigits(v).slice(0, 14)
  const p1 = d.slice(0, 2)
  const p2 = d.slice(2, 5)
  const p3 = d.slice(5, 8)
  const p4 = d.slice(8, 12)
  const p5 = d.slice(12, 14)
  let out = p1
  if (p2) out += '.' + p2
  if (p3) out += '.' + p3
  if (p4) out += '/' + p4
  if (p5) out += '-' + p5
  return out
}

function maskCEP(v: string): string {
  const d = onlyDigits(v).slice(0, 8)
  const p1 = d.slice(0, 2)
  const p2 = d.slice(2, 5)
  const p3 = d.slice(5, 8)
  let out = p1
  if (p2) out += '.' + p2
  if (p3) out += '-' + p3
  return out
}

function maskPhone(v: string): string {
  const d = onlyDigits(v).slice(0, 10)
  const p1 = d.slice(0, 2)
  const p2 = d.slice(2, 6)
  const p3 = d.slice(6, 10)
  let out = ''
  if (p1) out += '(' + p1 + ') '
  if (p2) out += p2
  if (p3) out += '-' + p3
  return out
}

export default function ClientsPage(): React.ReactElement {
  const [data, setData] = useState<ClientListItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [open, setOpen] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)
  const [editing, setEditing] = useState<ClientListItem | null>(null)
  const [formPF] = Form.useForm<PessoaFisica>()
  const [formPJ] = Form.useForm<PessoaJuridica>()
  const [tipo, setTipo] = useState<'PF' | 'PJ'>('PF')

  async function load(): Promise<void> {
    setLoading(true)
    try {
      const [pfs, pjs] = await Promise.all([
        nestApi.get<PessoaFisica[]>('/api/clients/pf').then((r) => r.data).catch(() => []),
        nestApi.get<PessoaJuridica[]>('/api/clients/pj').then((r) => r.data).catch(() => []),
      ])
      const merged: ClientListItem[] = [
        ...pfs.map((p) => ({
          tipo: 'PF',
          id: p.idPF as number,
          nome: p.nome,
          documento: p.cpf,
          email: p.email,
          telefone: p.celular || p.whatsapp,
        })),
        ...pjs.map((p) => ({
          tipo: 'PJ',
          id: p.idPJ as number,
          nome: p.razaoSocial,
          documento: p.cnpj,
          email: p.email,
          telefone: p.telefone || p.celular || p.whatsapp,
        })),
      ]
      setData(merged)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function onCreate(): void {
    setEditing(null)
    setTipo('PF')
    formPF.resetFields()
    formPJ.resetFields()
    setOpen(true)
  }

  function openCreateWithTipo(t: 'PF' | 'PJ'): void {
    setEditing(null)
    setTipo(t)
    formPF.resetFields()
    formPJ.resetFields()
    setOpen(true)
  }

  async function onEdit(record: ClientListItem): Promise<void> {
    setEditing(record)
    setTipo(record.tipo)
    if (record.tipo === 'PF') {
      const pf = await nestApi.get<PessoaFisica>(`/api/clients/pf/${record.id}`).then((r) => r.data)
      formPF.setFieldsValue(pf)
    } else {
      const pj = await nestApi.get<PessoaJuridica>(`/api/clients/pj/${record.id}`).then((r) => r.data)
      formPJ.setFieldsValue(pj)
    }
    setOpen(true)
  }

  async function onDelete(record: ClientListItem): Promise<void> {
    const url = record.tipo === 'PF' ? `/api/clients/pf/${record.id}` : `/api/clients/pj/${record.id}`
    try {
      await nestApi.delete(url)
      message.success('Cliente removido')
      load()
    } catch (e: any) {
      // erro já exibido globalmente
    }
  }

  async function onSubmit(): Promise<void> {
    setSaving(true)
    try {
      if (tipo === 'PF') {
        const vals = await formPF.validateFields()
        const payload: PessoaFisica = {
          ...vals,
          nome: vals.nome?.toUpperCase() || '',
          endereco: vals.endereco?.toUpperCase() || '',
          complemento: vals.complemento?.toUpperCase(),
          bairro: vals.bairro?.toUpperCase() || '',
          cidade: vals.cidade?.toUpperCase() || '',
          uf: vals.uf?.toUpperCase() || '',
          email: (vals.email || '').toLowerCase(),
          cpf: maskCPF(vals.cpf),
          cep: maskCEP(vals.cep),
          celular: vals.celular ? maskPhone(vals.celular) : undefined,
          whatsapp: vals.whatsapp ? maskPhone(vals.whatsapp) : undefined,
        }
        if (editing && editing.tipo === 'PF') {
          await nestApi.put(`/api/clients/pf/${editing.id}`, payload)
          message.success('Pessoa Física atualizada')
        } else {
          await nestApi.post('/api/clients/pf', payload)
          message.success('Pessoa Física criada')
        }
      } else {
        const vals = await formPJ.validateFields()
        const payload: PessoaJuridica = {
          ...vals,
          razaoSocial: vals.razaoSocial?.toUpperCase() || '',
          nomeFantasia: vals.nomeFantasia?.toUpperCase(),
          endereco: vals.endereco?.toUpperCase() || '',
          complemento: vals.complemento?.toUpperCase(),
          bairro: vals.bairro?.toUpperCase() || '',
          cidade: vals.cidade?.toUpperCase() || '',
          uf: vals.uf?.toUpperCase() || '',
          email: (vals.email || '').toLowerCase(),
          cnpj: maskCNPJ(vals.cnpj),
          cep: maskCEP(vals.cep),
          telefone: vals.telefone ? maskPhone(vals.telefone) : undefined,
          representante: vals.representante?.toUpperCase(),
          celular: vals.celular ? maskPhone(vals.celular) : undefined,
          whatsapp: vals.whatsapp ? maskPhone(vals.whatsapp) : undefined,
        }
        if (editing && editing.tipo === 'PJ') {
          await nestApi.put(`/api/clients/pj/${editing.id}`, payload)
          message.success('Pessoa Jurídica atualizada')
        } else {
          await nestApi.post('/api/clients/pj', payload)
          message.success('Pessoa Jurídica criada')
        }
      }
      setOpen(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: 'Tipo', dataIndex: 'tipo', width: 90 },
    { title: 'Nome', dataIndex: 'nome' },
    { title: 'Documento', dataIndex: 'documento', width: 180 },
    { title: 'Email', dataIndex: 'email' },
    { title: 'Telefone', dataIndex: 'telefone' },
    {
      title: 'Ações',
      render: (_: unknown, record: ClientListItem) => (
        <Space>
          <Button onClick={() => onEdit(record)}>Editar</Button>
          <Popconfirm title="Confirma excluir?" onConfirm={() => onDelete(record)}>
            <Button danger>Excluir</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 12 }}>
        <Col xs={24} sm={12}>
          <Card hoverable onClick={() => openCreateWithTipo('PF')} title="Adicionar Pessoa Física" style={{ cursor: 'pointer' }}>
            Clique para cadastrar Pessoa Física com CPF e dados pessoais.
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card hoverable onClick={() => openCreateWithTipo('PJ')} title="Adicionar Pessoa Jurídica" style={{ cursor: 'pointer' }}>
            Clique para cadastrar Pessoa Jurídica com CNPJ e dados da empresa.
          </Card>
        </Col>
      </Row>
      <Table rowKey="id" columns={columns} dataSource={data} loading={loading} />

      <Modal open={open} onCancel={() => setOpen(false)} onOk={onSubmit} confirmLoading={saving} title={editing ? (tipo === 'PF' ? 'Editar Pessoa Física' : 'Editar Pessoa Jurídica') : 'Novo Cliente'}>
        <div style={{ marginBottom: 12 }}>
          <Radio.Group value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <Radio.Button value="PF">Pessoa Física</Radio.Button>
            <Radio.Button value="PJ">Pessoa Jurídica</Radio.Button>
          </Radio.Group>
        </div>

        {tipo === 'PF' ? (
          <Form form={formPF} layout="vertical">
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="nome" label="Nome" rules={[{ required: true }]}>
                  <Input onChange={(e) => formPF.setFieldsValue({ nome: e.target.value.toUpperCase() })} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="cpf" label="CPF" rules={[{ required: true, len: 14 }]}>
                  <Input onChange={(e) => formPF.setFieldsValue({ cpf: maskCPF(e.target.value) })} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={12}>
              <Col span={18}>
                <Form.Item name="endereco" label="Endereço" rules={[{ required: true }]}>
                  <Input onChange={(e) => formPF.setFieldsValue({ endereco: e.target.value.toUpperCase() })} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="complemento" label="Complemento">
                  <Input onChange={(e) => formPF.setFieldsValue({ complemento: e.target.value.toUpperCase() })} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={12}>
              <Col span={8}>
                <Form.Item name="bairro" label="Bairro" rules={[{ required: true }]}>
                  <Input onChange={(e) => formPF.setFieldsValue({ bairro: e.target.value.toUpperCase() })} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="cidade" label="Cidade" rules={[{ required: true }]}>
                  <Input onChange={(e) => formPF.setFieldsValue({ cidade: e.target.value.toUpperCase() })} />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item name="uf" label="UF" rules={[{ required: true, len: 2 }]}>
                  <Input maxLength={2} onChange={(e) => formPF.setFieldsValue({ uf: e.target.value.toUpperCase() })} />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item name="cep" label="CEP" rules={[{ required: true, len: 10 }]}>
                  <Input onChange={(e) => formPF.setFieldsValue({ cep: maskCEP(e.target.value) })} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={12}>
              <Col span={8}>
                <Form.Item name="celular" label="Celular">
                  <Input onChange={(e) => formPF.setFieldsValue({ celular: maskPhone(e.target.value) })} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="whatsapp" label="Whatsapp">
                  <Input onChange={(e) => formPF.setFieldsValue({ whatsapp: maskPhone(e.target.value) })} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}> 
                  <Input onChange={(e) => formPF.setFieldsValue({ email: e.target.value.toLowerCase() })} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        ) : (
          <Form form={formPJ} layout="vertical">
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="razaoSocial" label="Razão Social" rules={[{ required: true }]}>
                  <Input onChange={(e) => formPJ.setFieldsValue({ razaoSocial: e.target.value.toUpperCase() })} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="nomeFantasia" label="Nome Fantasia">
                  <Input onChange={(e) => formPJ.setFieldsValue({ nomeFantasia: e.target.value.toUpperCase() })} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="cnpj" label="CNPJ" rules={[{ required: true, len: 18 }]}>
                  <Input onChange={(e) => formPJ.setFieldsValue({ cnpj: maskCNPJ(e.target.value) })} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="telefone" label="Telefone">
                  <Input onChange={(e) => formPJ.setFieldsValue({ telefone: maskPhone(e.target.value) })} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={12}>
              <Col span={18}>
                <Form.Item name="endereco" label="Endereço" rules={[{ required: true }]}>
                  <Input onChange={(e) => formPJ.setFieldsValue({ endereco: e.target.value.toUpperCase() })} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="complemento" label="Complemento">
                  <Input onChange={(e) => formPJ.setFieldsValue({ complemento: e.target.value.toUpperCase() })} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={12}>
              <Col span={8}>
                <Form.Item name="bairro" label="Bairro" rules={[{ required: true }]}>
                  <Input onChange={(e) => formPJ.setFieldsValue({ bairro: e.target.value.toUpperCase() })} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="cidade" label="Cidade" rules={[{ required: true }]}>
                  <Input onChange={(e) => formPJ.setFieldsValue({ cidade: e.target.value.toUpperCase() })} />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item name="uf" label="UF" rules={[{ required: true, len: 2 }]}>
                  <Input maxLength={2} onChange={(e) => formPJ.setFieldsValue({ uf: e.target.value.toUpperCase() })} />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item name="cep" label="CEP" rules={[{ required: true, len: 10 }]}>
                  <Input onChange={(e) => formPJ.setFieldsValue({ cep: maskCEP(e.target.value) })} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={12}>
              <Col span={8}>
                <Form.Item name="representante" label="Representante">
                  <Input onChange={(e) => formPJ.setFieldsValue({ representante: e.target.value.toUpperCase() })} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="celular" label="Celular">
                  <Input onChange={(e) => formPJ.setFieldsValue({ celular: maskPhone(e.target.value) })} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="whatsapp" label="Whatsapp">
                  <Input onChange={(e) => formPJ.setFieldsValue({ whatsapp: maskPhone(e.target.value) })} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}> 
                  <Input onChange={(e) => formPJ.setFieldsValue({ email: e.target.value.toLowerCase() })} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        )}
      </Modal>
    </div>
  )
}