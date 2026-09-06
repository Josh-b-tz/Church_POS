package com.iglesiaAvivandoLaFe.church_pos.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import jakarta.servlet.http.HttpServletResponse;

import java.util.Arrays;
import java.util.List;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // 1. Configuración de CORS (Vital para que funcione en red desde otra PC)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                // 2. Desactivar CSRF (Estándar para APIs REST)
                .csrf(AbstractHttpConfigurer::disable)

                .authorizeHttpRequests(auth -> auth
                        // --- ZONA PÚBLICA ---
                        .requestMatchers("/ws-church/**", "/error", "/api/v1/auth/**").permitAll()

                        // --- ZONA COMÚN (LECTURA) ---
                        // IMPORTANTE: El Cajero necesita saber qué evento está activo para cargar la caja
                        .requestMatchers(HttpMethod.GET, "/api/v1/eventos/activo").hasAnyAuthority("ADMIN", "CAJERO", "COCINA")
                        // Todos necesitan ver el menú para poder operar
                        .requestMatchers(HttpMethod.GET, "/api/v1/productos/menu").hasAnyAuthority("ADMIN", "CAJERO", "COCINA")
                        .requestMatchers(HttpMethod.GET, "/api/v1/productos/globales").hasAnyAuthority("ADMIN", "CAJERO", "COCINA")

                        // --- ZONA CAJERO ---
                        // Buscar clientes para cobrarles con saldo
                        .requestMatchers(HttpMethod.GET, "/api/v1/clientes/**").hasAnyAuthority("ADMIN", "CAJERO")
                        // Crear clientes nuevos (si el cajero tiene permiso de registrar)
                        .requestMatchers(HttpMethod.POST, "/api/v1/clientes").hasAnyAuthority("ADMIN", "CAJERO")
                        // Registrar la venta (Cobrar)
                        .requestMatchers(HttpMethod.POST, "/api/v1/ordenes").hasAnyAuthority("ADMIN", "CAJERO")
                        // Devolver dinero (Liquidar saldo)
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/clientes/*/liquidar").hasAnyAuthority("ADMIN", "CAJERO")

                        // --- ZONA COCINA ---
                        // Ver el monitor de pedidos
                        .requestMatchers(HttpMethod.GET, "/api/v1/ordenes").hasAnyAuthority("ADMIN", "COCINA")
                        // Marcar pedido como entregado
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/ordenes/*/listo").hasAnyAuthority("ADMIN", "COCINA")

                        // --- ZONA ADMINISTRADOR (EL RESTO) ---
                        // Crear eventos, borrar productos, reportes, usuarios, etc.
                        .requestMatchers("/api/v1/**").hasAuthority("ADMIN")

                        // Cualquier otra petición no listada requiere estar logueado
                        .anyRequest().authenticated()
                )
                .httpBasic(basic -> basic.authenticationEntryPoint(
                        (request, response, authException) -> {
                            // 1. Código de estado 401
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            // 2. Formato JSON
                            response.setContentType("application/json");
                            // 3. El mensaje que atrapará tu AuthContext de React
                            response.getWriter().write("{\"message\": \"Usuario o contraseña incorrectos\"}");
                        }
                ));


        return http.build();
    }

    // --- CONFIGURACIÓN CORS PARA RED LOCAL ---
    // Esto permite que la PC 2 (Caja) y PC 3 (Cocina) se conecten al servidor sin errores de bloqueo.
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList("*"));

        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}