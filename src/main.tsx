import '@ant-design/v5-patch-for-react-19'
// StrictMode removido temporariamente para evitar erro de unmount em echarts-for-react no React 19
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import 'antd/dist/reset.css'
import App from './App'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
)
