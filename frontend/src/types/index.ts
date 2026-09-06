export interface Evento {
    id: number;
    nombre: string;
    activo: boolean;
}

export interface Producto {
    id: number;
    nombre: string;
    precio: number;
    categoria: 'COCINA' | 'TIENDA';
    stock?: number | null;           
    fechaVencimiento?: string | null; 
    evento?: { id: number; nombre: string } | null;
}

// Para el carrito de compras (Frontend solamente)
export interface ItemCarrito extends Producto {
    cantidad: number;
}

export interface Cliente {
    id: number;
    nombre: string;
    saldo: number;
}
