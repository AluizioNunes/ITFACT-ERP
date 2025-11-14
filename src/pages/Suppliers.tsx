import React, { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, Space, message, Select, Popconfirm } from 'antd'
import { nestApi } from '../api/http'
import { Supplier } from '../types'

export default function SuppliersPage(): React.ReactElement {
  const [data, setData] = useState<Supplier[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [open, setOpen] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [form] = Form.useForm<Supplier>()

  async function load(): Promise<void> {
    setLoading(true)
    try {
      const res = await nestApi.get<Supplier[]>('/api/suppliers')
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function onCreate(): void {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ type: 'MATERIAL' })
    setOpen(true)
  }

  function onEdit(record: Supplier): void {
    setEditing(record)
    form.setFieldsValue(record)
    setOpen(true)
  }

  async function onDelete(record: Supplier): Promise<void> {
    try {
      await nestApi.delete(`/api/suppliers/${record.id}`)
      message.success('Fornecedor removido')
      load()
    } catch (e: any) {
      // erro já exibido globalmente; opcionalmente reforçar
    }
  }

  async function onSubmit(): Promise<void> {
    const vals = await form.validateFields()
    setSaving(true)
    try {
      if (editing) {
        await nestApi.put(`/api/suppliers/${editing.id}`, vals)
        message.success('Fornecedor atualizado')
      } else {
        await nestApi.post('/api/suppliers', vals)
        message.success('Fornecedor criado')
      }
      setOpen(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: 'Nome', dataIndex: 'name' },
    { title: 'Email', dataIndex: 'email' },
    { title: 'Telefone', dataIndex: 'phone' },
    { title: 'Tipo', dataIndex: 'type', render: (t: Supplier['type']) => (t === 'MATERIAL' ? 'Material' : 'Serviço') },
    {
      title: 'Ações',
      render: (_: unknown, record: Supplier) => (
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
      <Space style={{ marginBottom: 12 }}>
        <Button type="primary" onClick={onCreate}>Novo Fornecedor</Button>
      </Space>
      <Table rowKey="id" columns={columns} dataSource={data} loading={loading} />

      <Modal open={open} onCancel={() => setOpen(false)} onOk={onSubmit} confirmLoading={saving} title={editing ? 'Editar Fornecedor' : 'Novo Fornecedor'}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Nome" rules={[{ required: true }]}> 
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Email inválido' }]}> 
            <Input onChange={(e) => form.setFieldsValue({ email: e.target.value.toLowerCase() })} />
          </Form.Item>
          <Form.Item name="phone" label="Telefone"> 
            <Input />
          </Form.Item>
          <Form.Item name="type" label="Tipo" rules={[{ required: true }]}> 
            <Select options={[
              { value: 'MATERIAL', label: 'Material' },
              { value: 'SERVICO', label: 'Serviço' },
            ]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}