import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// 1. Importamos la billetera de seguridad
import { AuthProvider } from './Context/AuthContext.tsx' // Asegúrate que la ruta coincida

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 2. Envolvemos TODA la App con el proveedor */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)