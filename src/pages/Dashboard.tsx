import React, { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Typography, Space, Select, DatePicker } from 'antd'
import ReactEcharts from 'echarts-for-react'
import { nestApi, fastApi } from '../api/http'
import { Client, Material, ServiceEntity } from '../types'

const { RangePicker } = DatePicker

export default function Dashboard(): React.ReactElement {
  const [stats, setStats] = useState<{ clients: number; materials: number; services: number; leads: number; activities: number; notes: number; suppMaterials: number; suppServices: number }>({ clients: 0, materials: 0, services: 0, leads: 0, activities: 0, notes: 0, suppMaterials: 0, suppServices: 0 })
  const [loading, setLoading] = useState<boolean>(false)
  const [days, setDays] = useState<number>(7)
  const [range, setRange] = useState<[string | null, string | null] | null>(null)

  useEffect(() => {
    let mounted = true
    async function load(): Promise<void> {
      setLoading(true)
      try {
        const params = range && range[0] && range[1]
          ? { params: { from: range[0], end: range[1] } }
          : { params: { days } }

        const [clients, materials, services, crmStats, notesCount, suppStats] = await Promise.all<[
          Client[],
          Material[],
          ServiceEntity[],
          { leads: number; activities: number },
          { count: number },
          { materials: number; services: number; total: number }
        ]>([
          nestApi.get<Client[]>('/api/clients').then((r) => r.data).catch(() => []),
          nestApi.get<Material[]>('/api/materials').then((r) => r.data).catch(() => []),
          nestApi.get<ServiceEntity[]>('/api/services').then((r) => r.data).catch(() => []),
          fastApi.get<{ leads: number; activities: number }>('/api/crm/stats', params).then((r) => r.data).catch(() => ({ leads: 0, activities: 0 })),
          nestApi.get<{ count: number }>('/api/notes/count').then((r) => r.data).catch(() => ({ count: 0 })),
          nestApi.get<{ materials: number; services: number; total: number }>('/api/suppliers/stats').then((r) => r.data).catch(() => ({ materials: 0, services: 0, total: 0 })),
        ])
        if (!mounted) return
        setStats({
          clients: clients.length,
          materials: materials.length,
          services: services.length,
          leads: crmStats.leads,
          activities: crmStats.activities,
          notes: notesCount.count,
          suppMaterials: suppStats.materials,
          suppServices: suppStats.services,
        })
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [days, range])

  const chartOption = {
    title: { text: 'Visão Geral' },
    tooltip: {},
    xAxis: { type: 'category', data: ['Clientes', 'Materiais', 'Serviços', 'Leads', 'Atividades', 'Notas', 'Fornec. Materiais', 'Fornec. Serviços'] },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: [stats.clients, stats.materials, stats.services, stats.leads, stats.activities, stats.notes, stats.suppMaterials, stats.suppServices] }],
  }

  return (
    <div>
      <Typography.Title level={3}>Dashboard</Typography.Title>
      <Space style={{ marginBottom: 12 }}>
        <Select
          value={days}
          onChange={(v) => { setDays(v); setRange(null) }}
          options={[{ value: 7, label: 'Últimos 7 dias' }, { value: 30, label: 'Últimos 30 dias' }, { value: 90, label: 'Últimos 90 dias' }]}
        />
        <RangePicker
          showTime
          onChange={(vals) => {
            const v0 = vals?.[0]?.toISOString() || null
            const v1 = vals?.[1]?.toISOString() || null
            if (v0 && v1) { setRange([v0, v1]); } else { setRange(null) }
          }}
        />
      </Space>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}><Card><Statistic title="Clientes" value={stats.clients} loading={loading} /></Card></Col>
        <Col xs={24} md={8}><Card><Statistic title="Materiais" value={stats.materials} loading={loading} /></Card></Col>
        <Col xs={24} md={8}><Card><Statistic title="Serviços" value={stats.services} loading={loading} /></Card></Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={8}><Card><Statistic title="Leads" value={stats.leads} loading={loading} /></Card></Col>
        <Col xs={24} md={8}><Card><Statistic title="Atividades" value={stats.activities} loading={loading} /></Card></Col>
        <Col xs={24} md={8}><Card><Statistic title="Notas" value={stats.notes} loading={loading} /></Card></Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}><Card><Statistic title="Fornecedores (Materiais)" value={stats.suppMaterials} loading={loading} /></Card></Col>
        <Col xs={24} md={12}><Card><Statistic title="Fornecedores (Serviços)" value={stats.suppServices} loading={loading} /></Card></Col>
      </Row>
      <Card style={{ marginTop: 16 }}>
        <ReactEcharts option={chartOption} style={{ height: 320 }} />
      </Card>
    </div>
  )
}