package com.iglesiaAvivandoLaFe.church_pos.dto.request;

import lombok.Data;

@Data
public class ProductoOrdenRequest {
    private Long productoId;
    private Integer cantidad;
}