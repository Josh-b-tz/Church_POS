package com.iglesiaAvivandoLaFe.church_pos.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "eventos") // Nombre real de la tabla en la BD.
public class Evento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Auto-increment (1, 2, 3...)
    private Long id;

    @Column(nullable = false)
    private String nombre; // Ej: "Venta Pro-Construcción"

    @Column(name = "fecha_creacion")
    private LocalDateTime fecha = LocalDateTime.now(); // Se pone la hora actual por defecto

    private boolean activo = true;
}