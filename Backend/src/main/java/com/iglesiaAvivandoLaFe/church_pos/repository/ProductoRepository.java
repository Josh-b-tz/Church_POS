package com.iglesiaAvivandoLaFe.church_pos.repository;

import com.iglesiaAvivandoLaFe.church_pos.entity.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ProductoRepository extends JpaRepository<Producto, Long> {

    @Query("SELECT p FROM Producto p WHERE p.evento.id = :eventoId OR p.evento IS NULL")
    List<Producto> findByEventoId(@Param("eventoId") Long eventoId);

    // Para ver solo el inventario global (Tienda)
    List<Producto> findByEventoIsNull();
}