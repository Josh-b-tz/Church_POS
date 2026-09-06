package com.iglesiaAvivandoLaFe.church_pos.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Entity
@Table(name = "ordenes")
public class Orden {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime fecha = LocalDateTime.now();

    private BigDecimal total;

    @Enumerated(EnumType.STRING) // Guarda el texto "PENDIENTE" en la BD en vez de un número
    private EstadoOrden estado = EstadoOrden.PENDIENTE;

    // RELACIÓN: Una orden pertenece a un Evento (La kermesse del domingo)
    @ManyToOne
    @JoinColumn(name = "evento_id", nullable = false)
    private Evento evento;

    // RELACIÓN: Una orden PUEDE tener un cliente (si paga con saldo) o ser NULL (si es efectivo anónimo)
    @ManyToOne
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    @OneToMany(mappedBy = "orden", cascade = CascadeType.ALL, fetch = FetchType.EAGER) // EAGER es importante para reportes rápidos sin líos de sesión
    private List<OrdenDetalle> detalles;

    public List<OrdenDetalle> getDetalles() { return detalles; }
    public void setDetalles(List<OrdenDetalle> detalles) {
        this.detalles = detalles;
    }

    @Column(name = "nombre_cliente_temporal")
    private String nombreClienteTemporal;

    // ... Getters y Setters ...
    public String getNombreClienteTemporal() { return nombreClienteTemporal; }
    public void setNombreClienteTemporal(String nombreClienteTemporal) { this.nombreClienteTemporal = nombreClienteTemporal; }
}