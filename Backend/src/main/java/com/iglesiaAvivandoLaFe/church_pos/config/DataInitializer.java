package com.iglesiaAvivandoLaFe.church_pos.config;

import com.iglesiaAvivandoLaFe.church_pos.entity.Rol;
import com.iglesiaAvivandoLaFe.church_pos.entity.Usuario;
import com.iglesiaAvivandoLaFe.church_pos.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Bean
    public CommandLineRunner initData() {
        return args -> {
            // Solo creamos usuarios si la tabla está vacía
            if (usuarioRepository.count() == 0) {

                // 1.  ADMIN
                Usuario admin = new Usuario();
                admin.setUsername("admin");
                admin.setPassword(passwordEncoder.encode("admin123")); // Contraseña segura
                admin.setRol(Rol.ADMIN);
                usuarioRepository.save(admin);

                // 2.CAJERO
                Usuario cajero = new Usuario();
                cajero.setUsername("caja1");
                cajero.setPassword(passwordEncoder.encode("caja123"));
                cajero.setRol(Rol.CAJERO);
                usuarioRepository.save(cajero);

                // 3.  COCINA
                Usuario cocina = new Usuario();
                cocina.setUsername("cocina");
                cocina.setPassword(passwordEncoder.encode("cocina123"));
                cocina.setRol(Rol.COCINA);
                usuarioRepository.save(cocina);

                System.out.println("✅ USUARIOS CREADOS POR DEFECTO:");
                System.out.println("   - Admin: admin / admin123");
                System.out.println("   - Caja:  caja1 / caja123");
                System.out.println("   - Cocina: cocina / cocina123");
            }
        };
    }
}