package com.iglesiaAvivandoLaFe.church_pos.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate; // <--- Importante para fechas

@Data
@Entity
@Table(name = "productos")
public class Producto {

    @Enumerated(EnumType.STRING)
    private CategoriaProducto categoria;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private BigDecimal precio;

    // --- NUEVOS CAMPOS DE INVENTARIO ---
    private Integer stock; // Cantidad real en bodega

    @Column(name = "fecha_vencimiento")
    private LocalDate fechaVencimiento; // Para saber cuándo caduca el Tortrix

    // --- CAMBIO CLAVE: nullable = true ---
    // Si tiene evento, es de Cocina (temporal).
    // Si es NULL, es de Tienda (permanente).
    @ManyToOne
    @JoinColumn(name = "evento_id", nullable = true)
    private Evento evento;
}