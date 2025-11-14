import React, { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, InputNumber, Space, Select, message, Popconfirm } from 'antd'
import { nestApi } from '../api/http'
import { Client, Material, ServiceEntity } from '../types'

export default function BudgetsPage(): React.ReactElement {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [open, setOpen] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form] = Form.useForm()
  const [clients, setClients] = useState<Client[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [services, setServices] = useState<ServiceEntity[]>([])
  const [materialItems, setMaterialItems] = useState<Array<{ materialId: number | null; quantity: number }>>([])
  const [serviceItems, setServiceItems] = useState<Array<{ serviceId: number | null; hours: number }>>([])

  async function load(): Promise<void> {
    setLoading(true)
    try {
      const res = await nestApi.get<any[]>('/api/budgets')
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }

  async function loadRefs(): Promise<void> {
    try {
      const [cs, ms, ss] = await Promise.all<[
        Client[],
        Material[],
        ServiceEntity[]
      ]>([
        nestApi.get<Client[]>('/api/clients').then((r) => r.data).catch(() => []),
        nestApi.get<Material[]>('/api/materials').then((r) => r.data).catch(() => []),
        nestApi.get<ServiceEntity[]>('/api/services').then((r) => r.data).catch(() => []),
      ])
      setClients(cs)
      setMaterials(ms)
      setServices(ss)
    } catch {}
  }

  useEffect(() => { load(); loadRefs() }, [])

  function onCreate(): void {
    setEditing(null)
    form.resetFields()
    setMaterialItems([])
    setServiceItems([])
    setOpen(true)
  }

  async function onEdit(record: any): Promise<void> {
    const budget = await nestApi.get<any>(`/api/budgets/${record.id}`).then((r) => r.data)
    setEditing(budget)
    form.setFieldsValue({ number: budget.number, clientId: budget.client?.id })
    setMaterialItems((budget.materials || []).map((i: any) => ({ materialId: i.material?.id, quantity: Number(i.quantity) || 1 })))
    setServiceItems((budget.services || []).map((i: any) => ({ serviceId: i.service?.id, hours: Number(i.hours) || 1 })))
    setOpen(true)
  }

  async function onDelete(record: any): Promise<void> {
    await nestApi.delete(`/api/budgets/${record.id}`)
    message.success('Orçamento removido')
    load()
  }

  function addMaterial(): void {
    setMaterialItems((prev) => [...prev, { materialId: null, quantity: 1 }])
  }

  function addService(): void {
    setServiceItems((prev) => [...prev, { serviceId: null, hours: 1 }])
  }

  async function onSubmit(): Promise<void> {
    const vals = await form.validateFields()
    const payload = {
      number: vals.number,
      clientId: vals.clientId,
      materials: materialItems.filter((i) => i.materialId && i.quantity),
      services: serviceItems.filter((i) => i.serviceId && i.hours),
    }
    setSaving(true)
    try {
      if (editing) {
        await nestApi.put(`/api/budgets/${editing.id}`, payload)
        message.success('Orçamento atualizado')
      } else {
        await nestApi.post('/api/budgets', payload)
        message.success('Orçamento criado')
      }
      setOpen(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: 'Número', dataIndex: 'number' },
    { title: 'Cliente', dataIndex: ['client', 'name'] },
    { title: 'Total', dataIndex: 'total', render: (v: number) => Number(v).toFixed(2) },
    {
      title: 'Ações',
      render: (_: unknown, record: any) => (
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
        <Button type="primary" onClick={onCreate}>Novo Orçamento</Button>
      </Space>
      <Table rowKey="id" columns={columns} dataSource={data} loading={loading} />

      <Modal open={open} onCancel={() => setOpen(false)} onOk={onSubmit} confirmLoading={saving} title={editing ? 'Editar Orçamento' : 'Novo Orçamento'} width={800}>
        <Form form={form} layout="vertical">
          <Form.Item name="number" label="Número" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="clientId" label="Cliente" rules={[{ required: true }]}>
            <Select options={clients.map((c) => ({ value: c.id, label: c.name }))} showSearch />
          </Form.Item>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space>
              <Button onClick={addMaterial}>Adicionar Material</Button>
              <Button onClick={addService}>Adicionar Serviço</Button>
            </Space>
            {materialItems.map((item, idx) => (
              <Space key={`m-${idx}`} style={{ display: 'flex' }}>
                <Select
                  placeholder="Material"
                  style={{ minWidth: 240 }}
                  options={materials.map((m) => ({ value: m.id, label: `${m.name} (R$ ${Number(m.unitPrice).toFixed(2)})` }))}
                  value={item.materialId}
                  onChange={(v) => {
                    const next = [...materialItems]
                    next[idx].materialId = v
                    setMaterialItems(next)
                  }}
                />
                <InputNumber
                  min={1}
                  value={item.quantity}
                  onChange={(v) => {
                    const next = [...materialItems]
                    next[idx].quantity = v
                    setMaterialItems(next)
                  }}
                />
              </Space>
            ))}
            {serviceItems.map((item, idx) => (
              <Space key={`s-${idx}`} style={{ display: 'flex' }}>
                <Select
                  placeholder="Serviço"
                  style={{ minWidth: 240 }}
                  options={services.map((s) => ({ value: s.id, label: `${s.name} (R$ ${Number(s.hourlyRate).toFixed(2)}/h)` }))}
                  value={item.serviceId}
                  onChange={(v) => {
                    const next = [...serviceItems]
                    next[idx].serviceId = v
                    setServiceItems(next)
                  }}
                />
                <InputNumber
                  min={1}
                  value={item.hours}
                  onChange={(v) => {
                    const next = [...serviceItems]
                    next[idx].hours = v
                    setServiceItems(next)
                  }}
                />
              </Space>
            ))}
          </Space>
        </Form>
      </Modal>
    </div>
  )
}