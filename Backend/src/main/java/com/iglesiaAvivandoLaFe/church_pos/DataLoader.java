package com.iglesiaAvivandoLaFe.church_pos;

import com.iglesiaAvivandoLaFe.church_pos.entity.*;
import com.iglesiaAvivandoLaFe.church_pos.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;

@Component
public class DataLoader implements CommandLineRunner {

    private final ProductoRepository productoRepository;
    private final EventoRepository eventoRepository;

    public DataLoader(ProductoRepository productoRepository, EventoRepository eventoRepository) {
        this.productoRepository = productoRepository;
        this.eventoRepository = eventoRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        // Verificar si ya existen datos para no duplicar al reiniciar
        if (eventoRepository.count() == 0) {

            // 1. PRIMERO: Crear el Evento (La tienda depende de que exista un evento abierto)
            Evento evento = new Evento();
            evento.setNombre("Culto Dominical");
            evento.setActivo(true);
            eventoRepository.save(evento);

            System.out.println("✅ Evento creado: " + evento.getNombre());

            // 2. SEGUNDO: Crear Productos de COCINA
            crearProducto("Tostada", new BigDecimal("5.00"), CategoriaProducto.COCINA, evento);
            crearProducto("Chuchito", new BigDecimal("3.00"), CategoriaProducto.COCINA, evento);
            crearProducto("Atol", new BigDecimal("4.00"), CategoriaProducto.COCINA, evento);
            crearProducto("Dobblada", new BigDecimal("3.50"), CategoriaProducto.COCINA, evento);

            // 3. TERCERO: Crear Productos de TIENDA (Lo nuevo)
            crearProducto("Coca Cola", new BigDecimal("7.00"), CategoriaProducto.TIENDA, evento);
            crearProducto("Agua Pura", new BigDecimal("3.00"), CategoriaProducto.TIENDA, evento);
            crearProducto("Galleta", new BigDecimal("2.50"), CategoriaProducto.TIENDA, evento);
            crearProducto("Sabritas", new BigDecimal("5.00"), CategoriaProducto.TIENDA, evento);

            System.out.println("✅ Productos cargados exitosamente");
        }
    }

    // Método auxiliar para no repetir código
    private void crearProducto(String nombre, BigDecimal precio, CategoriaProducto categoria, Evento evento) {
        Producto p = new Producto();
        p.setNombre(nombre);
        p.setPrecio(precio);
        p.setCategoria(categoria);
        p.setEvento(evento);
        p.setStock(100); // Ponemos un stock inicial ficticio
        productoRepository.save(p);
    }
}