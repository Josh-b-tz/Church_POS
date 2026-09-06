package com.iglesiaAvivandoLaFe.church_pos.entity;

import com.fasterxml.jackson.annotation.JsonIgnore; // <--- Importante para evitar error 500
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Entity
@Table(name = "orden_detalles")
public class OrdenDetalle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @Column(nullable = false)
    private Integer cantidad;

    private BigDecimal subtotal;

    // RELACIÓN IMPORTANTE:
    @ManyToOne
    @JoinColumn(name = "orden_id", nullable = false)
    @JsonIgnore // <--- ESTA ETIQUETA ES LA CURA PARA EL ERROR 500 (Rompe el ciclo infinito)
    private Orden orden;

    // --- GETTERS Y SETTERS MANUALES (Por si Lombok falla) ---

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Producto getProducto() { return producto; }
    public void setProducto(Producto producto) { this.producto = producto; }

    public Integer getCantidad() { return cantidad; }
    public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }

    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }

    public Orden getOrden() { return orden; }
    public void setOrden(Orden orden) { this.orden = orden; }
}