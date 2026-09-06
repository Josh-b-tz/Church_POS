package com.iglesiaAvivandoLaFe.church_pos.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Entity
@Table(name = "clientes")
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre; // Ej: "Hermana Marta"

    @Column(nullable = false)
    private BigDecimal saldo = BigDecimal.ZERO; // ¡Importante! Empieza en 0.00
}