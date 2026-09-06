import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './Context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import HomePage from './pages/HomePage';
import CajaPage from './pages/CajaPage';
import CocinaPage from './pages/CocinaPage';
import ProductosPage from './pages/ProductosPage';
import ClientesPage from './pages/ClientesPage';
import InventarioPage from './pages/InventarioPage';
import ReportesPage from './pages/ReportesPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } />

          <Route path="/caja" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'CAJERO']}>
              <CajaPage />
            </ProtectedRoute>
          } />

          <Route path="/cocina" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'COCINA']}>
              <CocinaPage />
            </ProtectedRoute>
          } />

          {/* Ruta directa hacia el gestor de productos */}
          <Route path="/productos" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <ProductosPage />
            </ProtectedRoute>
          } />

          <Route path="/clientes" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'CAJERO']}>
                <ClientesPage />
            </ProtectedRoute>
          } />

            <Route path="/inventario" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
                <InventarioPage />
            </ProtectedRoute>
            } />

            <Route path="/reportes" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
                <ReportesPage />
            </ProtectedRoute>
            } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}