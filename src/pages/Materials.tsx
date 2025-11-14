import React, { useEffect, useMemo, useState } from 'react'
import { Table, Button, Modal, Form, Input, InputNumber, Space, message, Popconfirm, DatePicker, Select, Divider, Row, Col, Card } from 'antd'
import { ImportOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons'
import { nestApi } from '../api/http'
import { Material, MaterialEntryForm } from '../types'

export default function MaterialsPage(): React.ReactElement {
  const [data, setData] = useState<Material[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [open, setOpen] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)
  const [editing, setEditing] = useState<Material | null>(null)
  const [form] = Form.useForm<MaterialEntryForm>()
  const [filters, setFilters] = useState<{ id: string; name: string; sku: string; unitPrice: string; stockQuantity: string }>({
    id: '',
    name: '',
    sku: '',
    unitPrice: '',
    stockQuantity: '',
  })

  async function load(): Promise<void> {
    setLoading(true)
    try {
      const res = await nestApi.get<Material[]>('/api/materials')
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function onCreate(): void {
    setEditing(null)
    form.resetFields()
    // valores default úteis
    form.setFieldsValue({ unitPrice: 0, stockQuantity: 0, purchaseUnitPrice: 0, unit: 'UN' })
    setOpen(true)
  }

  function onEdit(record: Material): void {
    setEditing(record)
    form.setFieldsValue(record)
    setOpen(true)
  }

  async function onDelete(record: Material): Promise<void> {
    try {
      await nestApi.delete(`/api/materials/${record.id}`)
      message.success('Material removido')
      load()
    } catch (e: any) {
      // erro já exibido globalmente
    }
  }

  async function onSubmit(): Promise<void> {
    const vals = await form.validateFields()
    setSaving(true)
    try {
      // Enviar apenas campos compatíveis com o backend atual
      const payload = {
        name: vals.name,
        sku: vals.sku,
        unitPrice: Number(vals.unitPrice || 0),
        stockQuantity: Number(vals.stockQuantity || 0),
      }
      if (editing) {
        await nestApi.put(`/api/materials/${editing.id}`, payload)
        message.success('Material atualizado')
      } else {
        await nestApi.post('/api/materials', payload)
        message.success('Material criado')
      }
      setOpen(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    {
      title: (
        <div>
          <div>ID</div>
          <Input size="small" placeholder="Filtrar..." value={filters.id} onChange={(e) => setFilters({ ...filters, id: e.target.value })} />
        </div>
      ),
      dataIndex: 'id',
      width: 80,
    },
    {
      title: (
        <div>
          <div>Nome</div>
          <Input size="small" placeholder="Filtrar..." value={filters.name} onChange={(e) => setFilters({ ...filters, name: e.target.value })} />
        </div>
      ),
      dataIndex: 'name',
    },
    {
      title: (
        <div>
          <div>SKU</div>
          <Input size="small" placeholder="Filtrar..." value={filters.sku} onChange={(e) => setFilters({ ...filters, sku: e.target.value })} />
        </div>
      ),
      dataIndex: 'sku',
    },
    {
      title: (
        <div>
          <div>Preço Unitário</div>
          <Input size="small" placeholder="Filtrar..." value={filters.unitPrice} onChange={(e) => setFilters({ ...filters, unitPrice: e.target.value })} />
        </div>
      ),
      dataIndex: 'unitPrice',
      render: (v: number) => Number(v).toFixed(2),
    },
    {
      title: (
        <div>
          <div>Estoque</div>
          <Input size="small" placeholder="Filtrar..." value={filters.stockQuantity} onChange={(e) => setFilters({ ...filters, stockQuantity: e.target.value })} />
        </div>
      ),
      dataIndex: 'stockQuantity',
    },
    {
      title: 'Ações',
      render: (_: unknown, record: Material) => (
        <Space>
          <Button onClick={() => onEdit(record)}>Editar</Button>
          <Popconfirm title="Confirma excluir?" onConfirm={() => onDelete(record)}>
            <Button danger>Excluir</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const filteredData = useMemo(() => {
    return (data || []).filter((m) => {
      const idMatch = !filters.id || String(m.id).includes(filters.id)
      const nameMatch = !filters.name || (m.name || '').toLowerCase().includes(filters.name.toLowerCase())
      const skuMatch = !filters.sku || (m.sku || '').toLowerCase().includes(filters.sku.toLowerCase())
      const unitPriceMatch = !filters.unitPrice || String(m.unitPrice ?? '').includes(filters.unitPrice)
      const stockMatch = !filters.stockQuantity || String(m.stockQuantity ?? '').includes(filters.stockQuantity)
      return idMatch && nameMatch && skuMatch && unitPriceMatch && stockMatch
    })
  }, [data, filters])

  // Atualiza margem automaticamente: venda - custo
  const handlePriceChange = (): void => {
    const sell = Number(form.getFieldValue('unitPrice') || 0)
    const cost = Number(form.getFieldValue('purchaseUnitPrice') || 0)
    form.setFieldsValue({ margin: Number((sell - cost).toFixed(2)) })
  }

  const handleValuesChange = (changedValues) => {
    const patch = {};
    for (const key in changedValues) {
        const value = changedValues[key];
        if (typeof value === 'string' && value !== value.toUpperCase()) {
            patch[key] = value.toUpperCase();
        }
    }
    if (Object.keys(patch).length > 0) {
        form.setFieldsValue(patch);
    }
  };

  return (
    <div>
      <Space style={{ marginBottom: 12 }}>
        <Button
          onClick={onCreate}
          style={{ background: '#001529', color: '#fff', borderColor: '#001529', fontWeight: 700, letterSpacing: 0.5 }}
          icon={<ImportOutlined />}
        >
          ENTRADA DE MATERIAL
        </Button>
      </Space>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        onRow={(_, index) => ({
          style: { backgroundColor: (index ?? 0) % 2 === 0 ? '#87CEEB' : '#E0FFFF' },
        })}
      />

      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        onOk={onSubmit}
        confirmLoading={saving}
        width="80vw"
        style={{ top: 20 }}
        title={
          <div style={{ background: '#001529', color: '#fff', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 12, fontWeight: 700, letterSpacing: 0.5 }}>
            <span style={{ fontSize: 18 }}>ITFACT ERP</span>
            <span style={{ opacity: 0.85, fontWeight: 600, fontSize: 16 }}>CADASTRO DE MATERIAIS</span>
          </div>
        }
        styles={{
          content: { borderRadius: 0, padding: 0, height: 'calc(100vh - 40px)' },
          header: { padding: 0, margin: 0, borderBottom: '1px solid #f0f0f0' },
          body: { padding: '16px 24px', overflowY: 'auto', maxHeight: 'calc(100vh - 150px)', textTransform: 'uppercase' },
          footer: { padding: '10px 24px', textAlign: 'right', borderTop: '1px solid #f0f0f0', position: 'absolute', bottom: 0, width: '100%', background: '#fff' }
        }}
        footer={
          <Space>
            <Button icon={<CloseOutlined />} onClick={() => setOpen(false)} style={{ fontWeight: 700, letterSpacing: 0.5 }}>
              CANCELAR
            </Button>
            <Button icon={<SaveOutlined />} type="primary" loading={saving} onClick={onSubmit} style={{ background: '#001529', color: '#fff', borderColor: '#001529', fontWeight: 700, letterSpacing: 0.5 }}>
              SALVAR PRODUTO
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" size="small" onValuesChange={handleValuesChange}>
          <Row gutter={16}>
            <Col span={12}>
              <Card title={<div style={{ backgroundColor: '#00BFFF', color: 'white', padding: '4px 8px', borderRadius: '4px', fontWeight: 700, letterSpacing: 0.5 }}>DADOS DO PRODUTO</div>} style={{ marginBottom: 16 }}>
                <Row gutter={12}>
                  <Col span={8}><Form.Item name="sku" label="SKU" rules={[{ required: true }]}><Input placeholder="SKU" style={{ width: '100%' }} /></Form.Item></Col>
                  <Col span={8}><Form.Item name="manufacturerCode" label="CÓDIGO FABRICANTE"><Input placeholder="CÓDIGO" style={{ width: '100%' }} /></Form.Item></Col>
                  <Col span={8}><Form.Item name="internalCode" label="CÓDIGO INTERNO"><Input placeholder="CÓDIGO" style={{ width: '100%' }} /></Form.Item></Col>
                  <Col span={24}><Form.Item name="name" label="NOME DO PRODUTO *" rules={[{ required: true }]}><Input placeholder="DIGITE O NOME DO PRODUTO" style={{ width: '100%' }} /></Form.Item></Col>
                  <Col span={24}><Form.Item name="model" label="MODELO"><Input placeholder="DIGITE O MODELO" style={{ width: '100%' }} /></Form.Item></Col>
                  <Col span={12}><Form.Item name="category" label="CATEGORIA/DEPARTAMENTO"><Input placeholder="DIGITE A CATEGORIA" style={{ width: '100%' }} /></Form.Item></Col>
                  <Col span={12}><Form.Item name="manufacturer" label="FABRICANTE/MARCA"><Input placeholder="DIGITE O FABRICANTE" style={{ width: '100%' }} /></Form.Item></Col>
                  <Col span={24}><Form.Item name="origin" label="ORIGEM"><Input placeholder="DIGITE A ORIGEM" style={{ width: '100%' }} /></Form.Item></Col>
                  <Col span={24}><Form.Item name="description" label="DESCRIÇÃO DETALHADA"><Input.TextArea placeholder="DIGITE A DESCRIÇÃO DETALHADA DO PRODUTO" rows={2} style={{ width: '100%' }} /></Form.Item></Col>
                </Row>
              </Card>
            </Col>
            <Col span={12}>
              <Card title={<div style={{ backgroundColor: '#00BFFF', color: 'white', padding: '4px 8px', borderRadius: '4px', fontWeight: 700, letterSpacing: 0.5 }}>CAMPOS ADICIONAIS</div>} style={{ marginBottom: 16 }}>
                <Row gutter={12}>
                  <Col span={12}><Form.Item name="expirationDate" label="DATA DE VALIDADE"> <DatePicker style={{ width: '100%' }} /> </Form.Item></Col>
                  <Col span={12}><Form.Item name="lotNumber" label="NÚMERO DE LOTE"> <Input placeholder="NÚMERO DE LOTE" style={{ width: '100%' }} /> </Form.Item></Col>
                  <Col span={24}><Form.Item name="weight" label="PESO (KG)"> <InputNumber min={0} style={{ width: '100%' }} /> </Form.Item></Col>
                  <Col span={8}><Form.Item name="height" label="ALTURA (CM)"> <InputNumber min={0} style={{ width: '100%' }} /> </Form.Item></Col>
                  <Col span={8}><Form.Item name="width" label="LARGURA (CM)"> <InputNumber min={0} style={{ width: '100%' }} /> </Form.Item></Col>
                  <Col span={8}><Form.Item name="depth" label="PROFUNDIDADE (CM)"> <InputNumber min={0} style={{ width: '100%' }} /> </Form.Item></Col>
                </Row>
              </Card>
              <Card title={<div style={{ backgroundColor: '#00BFFF', color: 'white', padding: '4px 8px', borderRadius: '4px', fontWeight: 700, letterSpacing: 0.5 }}>VALORES E CUSTOS</div>} style={{ marginBottom: 16 }}>
                <Row gutter={12}>
                  <Col span={12}><Form.Item name="purchaseUnitPrice" label="VALOR UNITÁRIO DE ENTRADA (CUSTO) *" rules={[{ required: true }]}> <InputNumber min={0} style={{ width: '100%' }} onChange={handlePriceChange} /> </Form.Item></Col>
                  <Col span={12}><Form.Item name="unitPrice" label="PREÇO DE VENDA UNITÁRIO *" rules={[{ required: true }]}> <InputNumber min={0} style={{ width: '100%' }} onChange={handlePriceChange} /> </Form.Item></Col>
                  <Col span={12}><Form.Item name="margin" label="MARGEM (R$)" > <InputNumber min={0} style={{ width: '100%' }} disabled /> </Form.Item></Col>
                </Row>
              </Card>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Card title={<div style={{ backgroundColor: '#00BFFF', color: 'white', padding: '4px 8px', borderRadius: '4px', fontWeight: 700, letterSpacing: 0.5 }}>ESTOQUE E LOCALIZAÇÃO</div>} style={{ marginBottom: 16 }}>
                <Row gutter={12}>
                  <Col span={12}><Form.Item name="stockQuantity" label="ESTOQUE ATUAL" rules={[{ required: true }]}> <InputNumber min={0} style={{ width: '100%' }} /> </Form.Item></Col>
                  <Col span={12}><Form.Item name="unit" label="UNIDADE DE MEDIDA"> <Select style={{ width: '100%' }} options={[{ value: 'UN', label: 'UNIDADE' }, { value: 'CX', label: 'CAIXA' }, { value: 'M', label: 'METRO' }, { value: 'L', label: 'LITRO' }]} /> </Form.Item></Col>
                  <Col span={12}><Form.Item name="minStock" label="ESTOQUE MÍNIMO (PONTO DE PEDIDO)"> <InputNumber min={0} style={{ width: '100%' }} /> </Form.Item></Col>
                  <Col span={12}><Form.Item name="maxStock" label="ESTOQUE MÁXIMO"> <InputNumber min={0} style={{ width: '100%' }} /> </Form.Item></Col>
                  <Col span={8}><Form.Item name="aisle" label="CORREDOR"> <Input style={{ width: '100%' }} /> </Form.Item></Col>
                  <Col span={8}><Form.Item name="shelf" label="PRATELEIRA"> <Input style={{ width: '100%' }} /> </Form.Item></Col>
                  <Col span={8}><Form.Item name="position" label="POSIÇÃO"> <Input style={{ width: '100%' }} /> </Form.Item></Col>
                </Row>
              </Card>
            </Col>
            <Col span={12}>
              <Card title={<div style={{ backgroundColor: '#00BFFF', color: 'white', padding: '4px 8px', borderRadius: '4px', fontWeight: 700, letterSpacing: 0.5 }}>FORNECEDOR E LOGÍSTICA</div>} style={{ marginBottom: 16 }}>
                <Row gutter={12}>
                  <Col span={12}><Form.Item name="supplierName" label="FORNECEDOR PRINCIPAL"> <Input style={{ width: '100%' }} /> </Form.Item></Col>
                  <Col span={12}><Form.Item name="supplierCode" label="CÓDIGO DO FORNECEDOR (REFERÊNCIA/NCM)"> <Input style={{ width: '100%' }} /> </Form.Item></Col>
                  <Col span={12}><Form.Item name="leadTimeDays" label="LEAD TIME (DIAS)"> <InputNumber min={0} style={{ width: '100%' }} /> </Form.Item></Col>
                  <Col span={12}><Form.Item name="barcode" label="CÓDIGO DE BARRAS (EAN/UPC)"> <Input style={{ width: '100%' }} /> </Form.Item></Col>
                </Row>
              </Card>
            </Col>
          </Row>

        </Form>
      </Modal>
    </div>
  )
}