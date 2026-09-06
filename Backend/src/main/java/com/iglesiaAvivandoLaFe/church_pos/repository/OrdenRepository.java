package com.iglesiaAvivandoLaFe.church_pos.repository;

import com.iglesiaAvivandoLaFe.church_pos.entity.EstadoOrden;
import com.iglesiaAvivandoLaFe.church_pos.entity.Orden;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OrdenRepository extends JpaRepository<Orden, Long> {

    // Para la cocina
    List<Orden> findByEventoIdAndEstado(Long eventoId, EstadoOrden estado);

    // Para el Excel
    List<Orden> findByEventoId(Long eventoId);

    // --- AGREGA ESTA LÍNEA ---
    // Nos permite encontrar las compras de un cliente antes de borrarlo
    List<Orden> findByClienteId(Long clienteId);
}