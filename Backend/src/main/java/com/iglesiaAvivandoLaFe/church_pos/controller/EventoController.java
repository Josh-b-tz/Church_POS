package com.iglesiaAvivandoLaFe.church_pos.controller;

import com.iglesiaAvivandoLaFe.church_pos.entity.Evento;
import com.iglesiaAvivandoLaFe.church_pos.repository.EventoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;

import java.util.Collections;
import java.util.List;

@RestController // Dice: "Soy una API que responde JSON"
@RequestMapping("/api/v1/eventos") // La URL base será: http://localhost:8080/api/v1/eventos
@CrossOrigin(origins = "*") // ¡IMPORTANTE! Permite que el Frontend (React) se conecte sin bloqueos
public class EventoController {

    @Autowired
    private EventoRepository eventoRepository;

    // 1. GET: Ver todos los eventos pasados y futuros
    @GetMapping
    public List<Evento> listarTodos() {
        return eventoRepository.findAll();
    }

    // 2. POST: Crear un nuevo evento (Ej: "Venta Domingo 15")
    @PostMapping
    public Evento crearEvento(@RequestBody Evento nuevoEvento) {
        return eventoRepository.save(nuevoEvento);
    }

    // 3. GET: Buscar solo el evento activo (para la Tablet del cajero)
    @GetMapping("/activo")
    public Evento obtenerEventoActivo() {
        return eventoRepository.findFirstByActivoTrueOrderByIdDesc()
                .orElseThrow(() -> new RuntimeException("No hay ningún evento activo hoy."));
    }

    // 1. CERRAR EVENTO (Soft Close)
    // PATCH /api/v1/eventos/1/cerrar
    @PatchMapping("/{id}/cerrar")
    public Evento cerrarEvento(@PathVariable Long id) {
        return eventoRepository.findById(id).map(evento -> {
            evento.setActivo(false); // Lo apagamos
            return eventoRepository.save(evento);
        }).orElseThrow(() -> new RuntimeException("Evento no encontrado"));
    }

    // 2. ELIMINAR EVENTO (Hard Delete - Cuidado!)
    // DELETE /api/v1/eventos/1
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarEvento(@PathVariable Long id) {
        try {
            eventoRepository.deleteById(id);
            return ResponseEntity.ok(Collections.singletonMap("mensaje", "Evento eliminado correctamente"));

        } catch (DataIntegrityViolationException e) {
            // Si MySQL se queja de que hay datos amarrados, mandamos un error 409 (Conflicto)
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Collections.singletonMap("error", "No se puede eliminar. El evento ya tiene productos o ventas registradas. Mejor ciérrelo."));

        } catch (Exception e) {
            // Cualquier otro error raro
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "Error interno al intentar eliminar el evento."));
        }
    }
}