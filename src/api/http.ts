import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { message } from 'antd'

export const nestBaseURL: string = import.meta.env.VITE_NEST_API_URL || 'http://localhost:8080/nest'
export const fastBaseURL: string = import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8080/crm'

export const nestApi: AxiosInstance = axios.create({
  baseURL: nestBaseURL,
  headers: { 'Content-Type': 'application/json' },
})

export const fastApi: AxiosInstance = axios.create({
  baseURL: fastBaseURL,
  headers: { 'Content-Type': 'application/json' },
})

function onRejected(e: any): Promise<never> {
  const status = e?.response?.status
  const data = e?.response?.data
  let text =
    typeof data === 'string'
      ? data
      : data?.message || data?.error || e?.message || 'Erro ao comunicar com a API'
  const lower = String(text || '').toLowerCase()
  if (lower.includes('duplicate') || lower.includes('unique')) {
    if (lower.includes('cpf')) text = 'CPF já cadastrado'
    else if (lower.includes('cnpj')) text = 'CNPJ já cadastrado'
    else if (lower.includes('email')) text = 'Email já cadastrado'
    else if (lower.includes('sku')) text = 'SKU já cadastrado'
    else text = 'Registro já existe (campo único)'
  }
  message.error(`${status ? `[${status}] ` : ''}${text}`)
  return Promise.reject(e)
}

nestApi.interceptors.response.use((r: AxiosResponse) => r, onRejected)
fastApi.interceptors.response.use((r: AxiosResponse) => r, onRejected)