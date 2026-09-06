package com.iglesiaAvivandoLaFe.church_pos.controller;

import com.iglesiaAvivandoLaFe.church_pos.entity.Producto;
import com.iglesiaAvivandoLaFe.church_pos.repository.ProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;

import java.util.List;

@RestController
@RequestMapping("/api/v1/productos")
@CrossOrigin(origins = "*")
public class ProductoController {

    @Autowired
    private ProductoRepository productoRepository;

    // 1. GET: MENÚ MIXTO (Para la Caja)
    // Trae los productos de Cocina de este evento + Los de Tienda Globales
    // Uso: /api/v1/productos/menu?eventoId=1
    @GetMapping("/menu")
    public List<Producto> obtenerMenu(@RequestParam Long eventoId) {
        // Llama a la @Query personalizada que pusimos en el Repositorio
        return productoRepository.findByEventoId(eventoId);
    }

    // 2. GET: SOLO INVENTARIO GLOBAL (Para el Admin - Tienda)
    // Trae solo los productos que NO tienen evento asignado (Tienda permanente)
    // Uso: /api/v1/productos/globales
    @GetMapping("/globales")
    public List<Producto> obtenerInventarioGlobal() {
        // Necesitas tener el método findByEventoIsNull() en tu Repository
        return productoRepository.findByEventoIsNull();
    }

    // 3. POST: Agregar un nuevo producto (Cocina o Tienda)
    @PostMapping
    public Producto crearProducto(@RequestBody Producto producto) {
        return productoRepository.save(producto);
    }

    // 4. DELETE: Eliminar producto
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarProducto(@PathVariable Long id) {
        // Verificar si este producto ya fue vendido alguna vez (integridad de datos)
        try {
            productoRepository.deleteById(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("No se puede eliminar: El producto ya está en ordenes vendidas.");
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarProducto(@PathVariable Long id, @RequestBody Producto productoActualizado) {
        // 1. Buscamos el producto viejo en la base de datos
        return productoRepository.findById(id).map(productoExistente -> {

            // 2. Actualizamos solo los campos que nos interesan
            productoExistente.setNombre(productoActualizado.getNombre());
            productoExistente.setPrecio(productoActualizado.getPrecio());
            productoExistente.setCategoria(productoActualizado.getCategoria());
            productoExistente.setStock(productoActualizado.getStock());
            productoExistente.setFechaVencimiento(productoActualizado.getFechaVencimiento());

            // 3. Guardamos los cambios
            Producto guardado = productoRepository.save(productoExistente);
            return ResponseEntity.ok(guardado);

        }).orElse(ResponseEntity.notFound().build());
    }
}