import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login'; // Asegúrate de tener este archivo creado
import HomePage from './pages/HomePage';
import CajaPage from './pages/CajaPage';
import CocinaPage from './pages/CocinaPage';
import AdminPage from './pages/AdminPage';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. RUTA PÚBLICA: Login */}
        <Route path="/login" element={<Login />} />

        {/* 2. RUTA PRINCIPAL (Menú): Accesible para cualquiera que esté logueado */}
        <Route path="/" element={
            <ProtectedRoute>
                <HomePage />
            </ProtectedRoute>
        } />
        
        {/* 3. CAJA: Solo Admin y Cajeros */}
        <Route path="/caja" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'CAJERO']}>
                <CajaPage />
            </ProtectedRoute>
        } />

        {/* 4. COCINA: Solo Admin y Cocina */}
        <Route path="/cocina" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'COCINA']}>
                <CocinaPage />
            </ProtectedRoute>
        } />

        {/* 5. ADMIN: Solo Admin (Nadie más entra aquí) */}
        <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminPage />
            </ProtectedRoute>
        } />

        {/* Cualquier ruta desconocida te manda al home (o al login si no estás auth) */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;