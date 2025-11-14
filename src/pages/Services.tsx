import React, { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, InputNumber, Space, message, Popconfirm } from 'antd'
import { nestApi } from '../api/http'
import { ServiceEntity } from '../types'

export default function ServicesPage(): React.ReactElement {
  const [data, setData] = useState<ServiceEntity[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [open, setOpen] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)
  const [editing, setEditing] = useState<ServiceEntity | null>(null)
  const [form] = Form.useForm<ServiceEntity>()

  async function load(): Promise<void> {
    setLoading(true)
    try {
      const res = await nestApi.get<ServiceEntity[]>('/api/services')
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function onCreate(): void {
    setEditing(null)
    form.resetFields()
    setOpen(true)
  }

  function onEdit(record: ServiceEntity): void {
    setEditing(record)
    form.setFieldsValue(record)
    setOpen(true)
  }

  async function onDelete(record: ServiceEntity): Promise<void> {
    try {
      await nestApi.delete(`/api/services/${record.id}`)
      message.success('Serviço removido')
      load()
    } catch (e: any) {
      // erro já exibido globalmente
    }
  }

  async function onSubmit(): Promise<void> {
    const vals = await form.validateFields()
    setSaving(true)
    try {
      if (editing) {
        await nestApi.put(`/api/services/${editing.id}`, vals)
        message.success('Serviço atualizado')
      } else {
        await nestApi.post('/api/services', vals)
        message.success('Serviço criado')
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
    { title: 'Descrição', dataIndex: 'description' },
    { title: 'Taxa/Hora', dataIndex: 'hourlyRate', render: (v: number) => Number(v).toFixed(2) },
    {
      title: 'Ações',
      render: (_: unknown, record: ServiceEntity) => (
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
        <Button type="primary" onClick={onCreate}>Novo Serviço</Button>
      </Space>
      <Table rowKey="id" columns={columns} dataSource={data} loading={loading} />

      <Modal open={open} onCancel={() => setOpen(false)} onOk={onSubmit} confirmLoading={saving} title={editing ? 'Editar Serviço' : 'Novo Serviço'}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Nome" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Descrição">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="hourlyRate" label="Taxa por Hora" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}