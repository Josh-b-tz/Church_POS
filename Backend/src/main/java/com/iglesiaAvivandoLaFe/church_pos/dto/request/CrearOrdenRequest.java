package com.iglesiaAvivandoLaFe.church_pos.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class CrearOrdenRequest {
    private Long eventoId;
    private Long clienteId; // Opcional (puede ser null si es venta en efectivo anónima)
    private String nombreTemporal;
    private List<ProductoOrdenRequest> productos;

    public String getNombreTemporal() { return nombreTemporal; }
    public void setNombreTemporal(String nombreTemporal) { this.nombreTemporal = nombreTemporal; }
}

