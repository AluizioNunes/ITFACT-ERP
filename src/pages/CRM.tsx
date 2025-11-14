import React, { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, Space, Tag, Select, Drawer, message } from 'antd'
import { fastApi } from '../api/http'
import { Lead, Activity } from '../types'

const statusColors: Record<string, string> = {
  new: 'blue',
  contacted: 'cyan',
  qualified: 'green',
  lost: 'red',
}

export default function CRMPage(): React.ReactElement {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [openLeadModal, setOpenLeadModal] = useState<boolean>(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [leadForm] = Form.useForm<Lead>()

  const [drawerOpen, setDrawerOpen] = useState<boolean>(false)
  const [currentLead, setCurrentLead] = useState<Lead | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [activitiesLoading, setActivitiesLoading] = useState<boolean>(false)
  const [activityForm] = Form.useForm<Activity>()

  async function loadLeads(): Promise<void> {
    setLoading(true)
    try {
      const res = await fastApi.get<Lead[]>('/api/crm/leads')
      setLeads(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadLeads() }, [])

  function onCreateLead(): void {
    setEditingLead(null)
    leadForm.resetFields()
    setOpenLeadModal(true)
  }

  function onEditLead(record: Lead): void {
    setEditingLead(record)
    leadForm.setFieldsValue(record)
    setOpenLeadModal(true)
  }

  async function onDeleteLead(record: Lead): Promise<void> {
    await fastApi.delete(`/api/crm/leads/${record._id || record.id}`)
    message.success('Lead removida')
    loadLeads()
  }

  async function submitLead(): Promise<void> {
    const vals = await leadForm.validateFields()
    if (editingLead) {
      await fastApi.put(`/api/crm/leads/${editingLead._id || editingLead.id}`, vals)
      message.success('Lead atualizada')
    } else {
      await fastApi.post('/api/crm/leads', vals)
      message.success('Lead criada')
    }
    setOpenLeadModal(false)
    loadLeads()
  }

  async function openActivities(record: Lead): Promise<void> {
    setCurrentLead(record)
    setDrawerOpen(true)
    setActivitiesLoading(true)
    try {
      const res = await fastApi.get<Activity[]>(`/api/crm/activities/${record._id || record.id}`)
      setActivities(res.data)
    } finally {
      setActivitiesLoading(false)
    }
  }

  async function addActivity(): Promise<void> {
    const vals = await activityForm.validateFields()
    const payload = { ...vals, leadId: (currentLead?._id || currentLead?.id) as string }
    await fastApi.post(`/api/crm/activities`, payload)
    message.success('Atividade adicionada')
    activityForm.resetFields()
    const res = await fastApi.get<Activity[]>(`/api/crm/activities/${currentLead?._id || currentLead?.id}`)
    setActivities(res.data)
  }

  const columns = [
    { title: 'Nome', dataIndex: 'name' },
    { title: 'Email', dataIndex: 'email' },
    { title: 'Telefone', dataIndex: 'phone' },
    { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag color={statusColors[s] || 'default'}>{s || 'new'}</Tag> },
    {
      title: 'Ações',
      render: (_: unknown, record: Lead) => (
        <Space>
          <Button onClick={() => onEditLead(record)}>Editar</Button>
          <Button onClick={() => openActivities(record)}>Atividades</Button>
          <Button danger onClick={() => onDeleteLead(record)}>Excluir</Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 12 }}>
        <Button type="primary" onClick={onCreateLead}>Nova Lead</Button>
      </Space>
      <Table rowKey={(r: Lead) => r._id || (r.id as string)} columns={columns} dataSource={leads} loading={loading} />

      <Modal open={openLeadModal} title={editingLead ? 'Editar Lead' : 'Nova Lead'} onCancel={() => setOpenLeadModal(false)} onOk={submitLead}>
        <Form form={leadForm} layout="vertical">
          <Form.Item name="name" label="Nome" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Telefone">
            <Input />
          </Form.Item>
          <Form.Item name="status" label="Status">
            <Select allowClear options={[
              { value: 'new', label: 'Novo' },
              { value: 'contacted', label: 'Contactado' },
              { value: 'qualified', label: 'Qualificado' },
              { value: 'lost', label: 'Perdido' },
            ]} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={currentLead ? `Atividades - ${currentLead.name}` : 'Atividades'} width={520}>
        <Form form={activityForm} layout="vertical" style={{ marginBottom: 16 }}>
          <Form.Item name="type" label="Tipo" rules={[{ required: true }]}>
            <Select options={[
              { value: 'note', label: 'Nota' },
              { value: 'call', label: 'Ligação' },
              { value: 'meeting', label: 'Reunião' },
              { value: 'email', label: 'Email' },
            ]} />
          </Form.Item>
          <Form.Item name="notes" label="Nota" rules={[{ required: true }]}> 
            <Input.TextArea rows={3} />
          </Form.Item>
          <Space>
            <Button type="primary" onClick={addActivity} disabled={!currentLead}>Adicionar</Button>
          </Space>
        </Form>
        <Table
          rowKey={(r: Activity) => (r as any)._id || (r.id as string)}
          loading={activitiesLoading}
          dataSource={activities}
          columns={[
            { title: 'Tipo', dataIndex: 'type' },
            { title: 'Nota', dataIndex: 'notes' },
            {
              title: 'Criado em',
              dataIndex: 'created_at',
              render: (v: string | undefined) => (v ? new Date(v).toLocaleString('pt-BR') : ''),
            },
          ]}
          pagination={{ pageSize: 5 }}
        />
      </Drawer>
    </div>
  )
}