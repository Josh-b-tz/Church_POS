package com.iglesiaAvivandoLaFe.church_pos.repository;

import com.iglesiaAvivandoLaFe.church_pos.entity.Evento;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface EventoRepository extends JpaRepository<Evento, Long> {

    // ¡MAGIA! Spring crea el SQL solo con leer este nombre:
    // "Busca un evento donde el campo 'activo' sea verdadero"
    Optional<Evento> findFirstByActivoTrueOrderByIdDesc();
}