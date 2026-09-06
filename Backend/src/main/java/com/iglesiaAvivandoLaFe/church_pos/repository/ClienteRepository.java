package com.iglesiaAvivandoLaFe.church_pos.repository;

import com.iglesiaAvivandoLaFe.church_pos.entity.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    // Búsqueda inteligente: Que contenga el nombre (ignorando mayúsculas/minúsculas)
    // Ej: Si buscas "marta", encuentra a "Marta", "MARTA", "Maria Marta"
    List<Cliente> findByNombreContainingIgnoreCase(String nombre);
}
