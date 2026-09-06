package com.iglesiaAvivandoLaFe.church_pos.entity;

public enum EstadoOrden {
    PENDIENTE,  // Se cobró, pero cocina no la ha hecho
    LISTO,      // Cocina ya la terminó (para que el mesero la recoja)
    ENTREGADO,  // El cliente ya se la comió
    CANCELADO,   // Hubo un error
}