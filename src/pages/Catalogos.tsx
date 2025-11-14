import React, { useEffect, useState } from 'react'
import { Typography, Card, Space, Tabs, Statistic, Row, Col, Table, Button, Select } from 'antd'
import { fastApi, fastBaseURL } from '../api/http'

type DbSummary = { products: number; pdfs: number; images: number }
type LocalSummary = { pdfs: number; images: number; spreadsheets: number; base: string }

export default function Catalogos(): React.ReactElement {
  const [dbSummary, setDbSummary] = useState<DbSummary | null>(null)
  const [localSummary, setLocalSummary] = useState<LocalSummary | null>(null)
  const [loadingDb, setLoadingDb] = useState<boolean>(false)
  const [loadingLocal, setLoadingLocal] = useState<boolean>(false)

  const [dbProducts, setDbProducts] = useState<any[]>([])
  const [loadingDbProducts, setLoadingDbProducts] = useState<boolean>(false)

  const [dbFilesType, setDbFilesType] = useState<'pdf' | 'image'>('pdf')
  const [dbFiles, setDbFiles] = useState<any[]>([])
  const [loadingDbFiles, setLoadingDbFiles] = useState<boolean>(false)

  const [localPdfs, setLocalPdfs] = useState<any[]>([])
  const [localSheets, setLocalSheets] = useState<any[]>([])
  const [loadingLocalFiles, setLoadingLocalFiles] = useState<boolean>(false)

  async function loadDb(): Promise<void> {
    setLoadingDb(true)
    try {
      const res = await fastApi.get<DbSummary>('/api/catalogs/db/summary')
      setDbSummary(res.data)
    } finally {
      setLoadingDb(false)
    }
  }

  async function loadDbProducts(): Promise<void> {
    setLoadingDbProducts(true)
    try {
      const res = await fastApi.get<{ items: any[] }>('/api/catalogs/db/products', { params: { limit: 50 } })
      setDbProducts(res.data.items || [])
    } finally {
      setLoadingDbProducts(false)
    }
  }

  async function loadDbFiles(type: 'pdf' | 'image'): Promise<void> {
    setLoadingDbFiles(true)
    try {
      const res = await fastApi.get<{ items: any[] }>('/api/catalogs/db/files', { params: { type, limit: 50 } })
      setDbFiles(res.data.items || [])
    } finally {
      setLoadingDbFiles(false)
    }
  }

  async function loadLocal(): Promise<void> {
    setLoadingLocal(true)
    try {
      const res = await fastApi.get<LocalSummary>('/api/catalogs/local/summary')
      setLocalSummary(res.data)
    } finally {
      setLoadingLocal(false)
    }
  }

  async function loadLocalFiles(): Promise<void> {
    setLoadingLocalFiles(true)
    try {
      const [pdfs, sheets] = await Promise.all([
        fastApi.get<{ items: any[] }>('/api/catalogs/local/list', { params: { type: 'pdfs', limit: 100 } }).then(r => r.data.items || []),
        fastApi.get<{ items: any[] }>('/api/catalogs/local/list', { params: { type: 'spreadsheets', limit: 100 } }).then(r => r.data.items || []),
      ])
      setLocalPdfs(pdfs)
      setLocalSheets(sheets)
    } finally {
      setLoadingLocalFiles(false)
    }
  }

  useEffect(() => {
    loadDb()
    loadDbProducts()
    loadDbFiles(dbFilesType)
    loadLocal()
    loadLocalFiles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { loadDbFiles(dbFilesType) }, [dbFilesType])

  const dbProductsColumns = [
    { title: 'Fabricante', dataIndex: 'manufacturer', width: 120 },
    { title: 'PDF', dataIndex: 'pdf_source' },
    { title: 'Nome do PDF', dataIndex: 'pdf_name' },
    { title: 'Página', dataIndex: 'page', width: 80 },
    {
      title: 'Ações',
      width: 160,
      render: (_: any, r: any) => (
        <Space>
          {r.pdf_file_id ? (
            <Button size="small" type="primary" href={`${fastBaseURL}/api/catalogs/db/file/${r.pdf_file_id}`} target="_blank" rel="noopener noreferrer">Ver PDF</Button>
          ) : (
            <Button size="small" disabled>Sem PDF no Mongo</Button>
          )}
          <Button size="small" href={r.pdf_url} target="_blank" rel="noopener noreferrer">Abrir Origem</Button>
        </Space>
      ),
    },
  ]

  const dbFilesColumns = [
    { title: 'Arquivo', dataIndex: 'filename' },
    { title: 'Tipo', dataIndex: ['metadata', 'type'], width: 100 },
    { title: 'Fabricante', dataIndex: ['metadata', 'manufacturer'], width: 120 },
    { title: 'Upload', dataIndex: 'uploadDate', width: 180, render: (v: string) => (v ? new Date(v).toLocaleString('pt-BR') : '') },
    {
      title: 'Ações',
      width: 140,
      render: (_: any, r: any) => (
        <Button size="small" type="primary" href={`${fastBaseURL}/api/catalogs/db/file/${r._id}`} target="_blank" rel="noopener noreferrer">Abrir</Button>
      ),
    },
  ]

  const localPdfsColumns = [
    { title: 'Arquivo', dataIndex: 'name' },
    { title: 'Tamanho', dataIndex: 'size', width: 120 },
    { title: 'Modificado', dataIndex: 'mtime', width: 180, render: (v: number) => new Date(v * 1000).toLocaleString('pt-BR') },
    {
      title: 'Ações',
      width: 140,
      render: (_: any, r: any) => (
        <Button size="small" type="primary" href={`${fastBaseURL}/api/catalogs/local/file?type=pdfs&name=${encodeURIComponent(r.relpath)}`} target="_blank" rel="noopener noreferrer">Abrir</Button>
      ),
    },
  ]

  const localSheetsColumns = [
    { title: 'Planilha', dataIndex: 'name' },
    { title: 'Tamanho', dataIndex: 'size', width: 120 },
    { title: 'Modificado', dataIndex: 'mtime', width: 180, render: (v: number) => new Date(v * 1000).toLocaleString('pt-BR') },
    {
      title: 'Ações',
      width: 140,
      render: (_: any, r: any) => (
        <Button size="small" type="primary" href={`${fastBaseURL}/api/catalogs/local/file?type=spreadsheets&name=${encodeURIComponent(r.relpath)}`} target="_blank" rel="noopener noreferrer">Abrir</Button>
      ),
    },
  ]

  return (
    <div>
      <Typography.Title level={3}>Catálogos</Typography.Title>
      <Tabs
        items={[
          {
            key: 'db',
            label: 'Banco de Dados (MongoDB)',
            children: (
              <Space direction="vertical" style={{ width: '100%' }} size={16}>
                <Card>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={8}><Statistic title="Produtos" value={dbSummary?.products || 0} loading={loadingDb} /></Col>
                    <Col xs={24} md={8}><Statistic title="PDFs" value={dbSummary?.pdfs || 0} loading={loadingDb} /></Col>
                    <Col xs={24} md={8}><Statistic title="Imagens" value={dbSummary?.images || 0} loading={loadingDb} /></Col>
                  </Row>
                </Card>
                <Card title="Produtos extraídos">
                  <Table rowKey={(r) => r._id || r.id} columns={dbProductsColumns} dataSource={dbProducts} loading={loadingDbProducts} pagination={{ pageSize: 10 }} />
                </Card>
                <Card title="Arquivos no MongoDB">
                  <Space style={{ marginBottom: 8 }}>
                    <span>Tipo:</span>
                    <Select value={dbFilesType} onChange={(v) => setDbFilesType(v)} options={[{ value: 'pdf', label: 'PDF' }, { value: 'image', label: 'Imagem' }]} />
                  </Space>
                  <Table rowKey={(r) => r._id} columns={dbFilesColumns} dataSource={dbFiles} loading={loadingDbFiles} pagination={{ pageSize: 10 }} />
                </Card>
              </Space>
            ),
          },
          {
            key: 'local',
            label: 'Arquivos Locais',
            children: (
              <Space direction="vertical" style={{ width: '100%' }} size={16}>
                <Card>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={8}><Statistic title="PDFs" value={localSummary?.pdfs || 0} loading={loadingLocal} /></Col>
                    <Col xs={24} md={8}><Statistic title="Imagens" value={localSummary?.images || 0} loading={loadingLocal} /></Col>
                    <Col xs={24} md={8}><Statistic title="Planilhas" value={localSummary?.spreadsheets || 0} loading={loadingLocal} /></Col>
                  </Row>
                </Card>
                <Card title="PDFs">
                  <Table rowKey={(r) => r.relpath} columns={localPdfsColumns} dataSource={localPdfs} loading={loadingLocalFiles} pagination={{ pageSize: 10 }} />
                </Card>
                <Card title="Planilhas">
                  <Table rowKey={(r) => r.relpath} columns={localSheetsColumns} dataSource={localSheets} loading={loadingLocalFiles} pagination={{ pageSize: 10 }} />
                </Card>
              </Space>
            ),
          },
        ]}
      />
    </div>
  )
}