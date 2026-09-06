package com.iglesiaAvivandoLaFe.church_pos.controller;

import com.iglesiaAvivandoLaFe.church_pos.dto.response.AuthResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = "*") // Permitir que React se conecte
public class AuthController {

    // Este endpoint solo se ejecuta SI el usuario y contraseña son correctos.
    // Spring Security hace el trabajo sucio antes de llegar aquí.
    @GetMapping("/login")
    public ResponseEntity<AuthResponse> login(Authentication authentication) {

        // Extraemos el rol del usuario que acaba de entrar
        String rol = authentication.getAuthorities().stream()
                .findFirst()
                .get()
                .getAuthority();

        return ResponseEntity.ok(new AuthResponse(
                authentication.getName(),
                rol,
                "Login Exitoso"
        ));
    }
}