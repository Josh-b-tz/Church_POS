package com.iglesiaAvivandoLaFe.church_pos.controller;

import com.iglesiaAvivandoLaFe.church_pos.entity.Cliente;
import com.iglesiaAvivandoLaFe.church_pos.entity.Orden;
import com.iglesiaAvivandoLaFe.church_pos.repository.ClienteRepository;
import com.iglesiaAvivandoLaFe.church_pos.repository.OrdenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/clientes")
@CrossOrigin(origins = "*")
public class ClienteController {

    @Autowired
    private ClienteRepository clienteRepository;

    // Necesitamos esto para desvincular las ventas antes de borrar
    @Autowired
    private OrdenRepository ordenRepository;

    // 1. Buscar clientes (Buscador Billetera)
    @GetMapping("/buscar")
    public List<Cliente> buscarClientes(@RequestParam String query) {
        if (query == null || query.isEmpty()) {
            return clienteRepository.findAll();
        }
        return clienteRepository.findByNombreContainingIgnoreCase(query);
    }

    // 2. Crear Cliente
    @PostMapping
    public Cliente crearCliente(@RequestBody Cliente cliente) {
        return clienteRepository.save(cliente);
    }

    // 3. Liquidar Saldo (Devolver dinero y dejar en 0)
    @PatchMapping("/{id}/liquidar")
    public Cliente liquidarSaldo(@PathVariable Long id) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        cliente.setSaldo(java.math.BigDecimal.ZERO);
        return clienteRepository.save(cliente);
    }

    // 4. ELIMINAR CLIENTE (SOLUCIÓN A TU ERROR)
    @DeleteMapping("/{id}")
    @Transactional // Importante para que todo ocurra en orden
    public ResponseEntity<?> eliminarCliente(@PathVariable Long id) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("No encontrado"));

        // PASO A: Buscar todas las órdenes de este hermano/a
        List<Orden> comprasDelCliente = ordenRepository.findByClienteId(id);

        // PASO B: "Desvincular". Guardamos el nombre como texto simple y quitamos el ID.
        // Así el Excel seguirá diciendo "Hermana Marta" aunque ella ya no exista en la BD.
        for (Orden orden : comprasDelCliente) {
            orden.setNombreClienteTemporal(cliente.getNombre() + " (Archivado)");
            orden.setCliente(null); // Rompemos el vínculo que causaba el error
            ordenRepository.save(orden);
        }

        // PASO C: Ahora sí, la base de datos nos deja borrarlo
        clienteRepository.delete(cliente);

        return ResponseEntity.ok().build();
    }

    // Endpoint auxiliar para ver saldo
    @GetMapping("/{id}/saldo")
    public ResponseEntity<?> obtenerSaldo(@PathVariable Long id) {
        Cliente c = clienteRepository.findById(id).orElseThrow();
        return ResponseEntity.ok(c.getSaldo());
    }
}