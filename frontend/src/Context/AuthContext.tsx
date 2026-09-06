import { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
// Importamos nuestro Punto Único de Verdad
import { api } from '../config/api';

// 1. Contrato del Usuario
interface User {
    username: string;
    role: string;
    authHeader: string;
}

interface CustomRequestInit {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
    logout: () => void;
    request: (path: string, options?: CustomRequestInit) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('church_user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
                setIsAuthenticated(true);
            } catch (error) {
                console.error("Error al leer usuario guardado", error);
                localStorage.removeItem('church_user');
            }
        }
        setLoading(false);
    }, []);

    // --- LA NUEVA SUPER FUNCIÓN 'request' REFACTORIZADA CON AXIOS ---
    const request = async (path: string, options: CustomRequestInit = {}) => { 
        try {
            // Axios maneja los encabezados y el parseo a JSON automáticamente
            const response = await api({
                url: path,
                method: options.method || 'GET',
                data: options.body, // Se envía en lugar de 'body' y hace stringify solo
                headers: {
                    ...options.headers,
                    ...(user?.authHeader ? { 'Authorization': user.authHeader } : {})
                }
            });
            
            return response.data;

        } catch (error: any) {
            // 2. Si el servidor nos dice 401 (No autorizado), cerramos sesión automáticamente
            if (error.response && error.response.status === 401) {
                logout();
                throw new Error("Sesión expirada");
            }

            console.error("Error en la petición:", error);
            throw new Error(error.response?.data?.message || "Error en la petición");
        }
    };

    const login = async (username: string, password: string) => {
        const token = 'Basic ' + btoa(username + ":" + password);

        try {
            // Usamos 'api' en lugar de 'fetch'. La ruta es solo lo que falta.
            const response = await api.get('/auth/login', {
                headers: {
                    'Authorization': token
                }
            });

            // Con Axios un 200 OK significa que pasó directo al bloque try
            const data = response.data;
            const userData: User = {
                username: data.username,
                role: data.rol, // Asegúrate de que tu backend devuelve 'rol' o 'role'
                authHeader: token
            };

            setUser(userData);
            setIsAuthenticated(true);
            localStorage.setItem('church_user', JSON.stringify(userData));
            return { success: true };

        } catch (error: any) {
            // Si el backend lanza un 401 u otro error, Axios lo captura aquí
            if (error.response && error.response.status === 401) {
                return { success: false, message: 'Credenciales incorrectas' };
            }
            return { success: false, message: 'Error al conectar con el servidor' };
        }
    };

    const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('church_user');
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, login, logout, loading, request }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth debe usarse dentro de un AuthProvider");
    }
    return context;
};