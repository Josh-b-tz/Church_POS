package com.iglesiaAvivandoLaFe.church_pos.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
    private String username;
    private String rol;
    private String mensaje;
}