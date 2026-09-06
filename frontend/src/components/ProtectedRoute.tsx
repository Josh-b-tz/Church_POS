import { Navigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import type { ReactNode } from 'react'; // <--- 1. Importamos esto

interface ProtectedRouteProps {
    children: ReactNode; // <--- 2. Usamos ReactNode en lugar de JSX.Element
    allowedRoles?: string[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
    const { user, isAuthenticated, loading } = useAuth();

    if (loading) return <div className="p-10 text-center">Cargando sistema...</div>;

    // 1. Si no está autenticado, al Login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // 2. Validación de Roles
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
                <h1 className="text-4xl mb-4">⛔</h1>
                <h2 className="text-xl font-bold text-red-600">Acceso Denegado</h2>
                <p className="text-gray-600">No tienes permisos para ver esta sección.</p>
                <button 
                    onClick={() => window.history.back()}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Regresar
                </button>
            </div>
        );
    }

    return <>{children}</>;
};