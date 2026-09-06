package com.iglesiaAvivandoLaFe.church_pos.controller;

import com.iglesiaAvivandoLaFe.church_pos.entity.*;
import com.iglesiaAvivandoLaFe.church_pos.repository.*;
// Imports para WebSockets y Excel
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/v1/ordenes")
@CrossOrigin(origins = "*")
public class OrdenController {

    @Autowired
    private OrdenRepository ordenRepository;
    @Autowired
    private ProductoRepository productoRepository;
    @Autowired
    private ClienteRepository clienteRepository;
    @Autowired
    private EventoRepository eventoRepository;

    // Inyección para notificar a Cocina (WebSockets)
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // --- 1. LISTAR ÓRDENES (Para Cocina) ---
    @GetMapping
    public List<Orden> obtenerOrdenes(@RequestParam Long eventoId, @RequestParam EstadoOrden estado) {
        return ordenRepository.findByEventoIdAndEstado(eventoId, estado);
    }

    // --- 2. MARCAR COMO LISTO (Para Cocina) ---
    @PatchMapping("/{id}/listo")
    public ResponseEntity<Orden> marcarComoListo(@PathVariable Long id) {
        Orden orden = ordenRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Orden no encontrada"));

        orden.setEstado(EstadoOrden.LISTO);
        ordenRepository.save(orden);

        // Notificar que la orden cambió (para actualizar pantallas automáticamente)
        messagingTemplate.convertAndSend("/topic/nuevas-ordenes", orden);

        return ResponseEntity.ok(orden);
    }

    // --- 3. CREAR VENTA (COBRAR + INVENTARIO + NOTIFICAR) ---
    @PostMapping
    @Transactional
    public ResponseEntity<?> crearOrden(@RequestBody CrearOrdenRequest request) {

        Orden orden = new Orden();
        orden.setFecha(LocalDateTime.now());
        orden.setEstado(EstadoOrden.PENDIENTE);

        Evento evento = eventoRepository.findById(request.getEventoId())
                .orElseThrow(() -> new RuntimeException("Evento no encontrado"));
        orden.setEvento(evento);

        BigDecimal totalCalculado = BigDecimal.ZERO;
        List<OrdenDetalle> detalles = new ArrayList<>();

        // Bucle de Productos: Calcular total y Restar Stock
        for (var item : request.getProductos()) {
            Producto producto = productoRepository.findById(item.getProductoId())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

            // Validar Stock (Solo si es producto de Tienda/Global)
            if (producto.getStock() != null) {
                if (producto.getStock() < item.getCantidad()) {
                    return ResponseEntity.badRequest()
                            .body("¡Stock insuficiente para " + producto.getNombre() + "! Quedan: " + producto.getStock());
                }
                // Restar
                producto.setStock(producto.getStock() - item.getCantidad());
                productoRepository.save(producto);
            }

            OrdenDetalle detalle = new OrdenDetalle();
            detalle.setProducto(producto);
            detalle.setCantidad(item.getCantidad());
            // Calcular precio
            detalle.setSubtotal(producto.getPrecio().multiply(new BigDecimal(item.getCantidad())));
            detalle.setOrden(orden);

            detalles.add(detalle);
            totalCalculado = totalCalculado.add(detalle.getSubtotal());
        }

        orden.setDetalles(detalles);
        orden.setTotal(totalCalculado);

        // Cobro (Saldo o Efectivo)
        if (request.getClienteId() != null) {
            Cliente cliente = clienteRepository.findById(request.getClienteId())
                    .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

            if (cliente.getSaldo().compareTo(totalCalculado) < 0) {
                return ResponseEntity.badRequest().body("Saldo insuficiente");
            }
            cliente.setSaldo(cliente.getSaldo().subtract(totalCalculado));
            clienteRepository.save(cliente);
            orden.setCliente(cliente);
        } else {
            orden.setNombreClienteTemporal(request.getNombreTemporal());
        }

        ordenRepository.save(orden);

        // ¡NOTIFICACIÓN REAL TIME A COCINA! 🔔
        messagingTemplate.convertAndSend("/topic/nuevas-ordenes", orden);

        return ResponseEntity.ok(orden);
    }

    // --- 4. EXPORTAR EXCEL (TU DISEÑO ORIGINAL RECUPERADO 🎨) ---
    @GetMapping("/exportar")
    public void exportarVentasExcel(HttpServletResponse response, @RequestParam Long eventoId) throws IOException {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=\"reporte_profesional.xlsx\"");

        List<Orden> ordenes = ordenRepository.findByEventoId(eventoId);

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Resumen Financiero");
            DataFormat format = workbook.createDataFormat();

            // === ESTILOS PROFESIONALES (VERDES) ===
            CellStyle mainTitleStyle = workbook.createCellStyle();
            mainTitleStyle.setFillForegroundColor(IndexedColors.SEA_GREEN.getIndex());
            mainTitleStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setColor(IndexedColors.WHITE.getIndex());
            titleFont.setFontHeightInPoints((short) 14);
            mainTitleStyle.setFont(titleFont);
            mainTitleStyle.setAlignment(HorizontalAlignment.CENTER);

            CellStyle greenHeaderStyle = workbook.createCellStyle();
            greenHeaderStyle.setFillForegroundColor(IndexedColors.LIGHT_GREEN.getIndex());
            greenHeaderStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            greenHeaderStyle.setFont(headerFont);
            ponerBordes(greenHeaderStyle);

            CellStyle dataStyle = workbook.createCellStyle();
            ponerBordes(dataStyle);

            CellStyle currencyStyle = workbook.createCellStyle();
            currencyStyle.cloneStyleFrom(dataStyle);
            currencyStyle.setDataFormat(format.getFormat("Q#,##0.00"));

            CellStyle greenTotalCurrencyStyle = workbook.createCellStyle();
            greenTotalCurrencyStyle.cloneStyleFrom(greenHeaderStyle);
            greenTotalCurrencyStyle.setDataFormat(format.getFormat("Q#,##0.00"));

            CellStyle grandTotalStyle = workbook.createCellStyle();
            grandTotalStyle.cloneStyleFrom(greenTotalCurrencyStyle);
            Font bigFont = workbook.createFont();
            bigFont.setBold(true);
            bigFont.setFontHeightInPoints((short) 12);
            grandTotalStyle.setFont(bigFont);

            CellStyle grandTotalLabelStyle = workbook.createCellStyle();
            grandTotalLabelStyle.cloneStyleFrom(greenHeaderStyle);
            grandTotalLabelStyle.setFont(bigFont);
            grandTotalLabelStyle.setAlignment(HorizontalAlignment.RIGHT);

            // === PROCESAMIENTO DE DATOS ===
            Map<String, Integer> conteoCocina = new HashMap<>();
            Map<String, Double> dineroCocina = new HashMap<>();
            double totalSumaCocina = 0.0;
            Map<String, Integer> conteoTienda = new HashMap<>();
            Map<String, Double> dineroTienda = new HashMap<>();
            double totalSumaTienda = 0.0;
            double granTotalDinero = 0.0;

            for (Orden orden : ordenes) {
                granTotalDinero += orden.getTotal().doubleValue();
                for (OrdenDetalle detalle : orden.getDetalles()) {
                    Producto producto = detalle.getProducto();
                    String nombreProd = producto.getNombre();
                    double subtotal = detalle.getSubtotal().doubleValue();
                    int cantidad = detalle.getCantidad();

                    if (producto.getCategoria() == CategoriaProducto.COCINA) {
                        conteoCocina.put(nombreProd, conteoCocina.getOrDefault(nombreProd, 0) + cantidad);
                        dineroCocina.put(nombreProd, dineroCocina.getOrDefault(nombreProd, 0.0) + subtotal);
                        totalSumaCocina += subtotal;
                    } else {
                        conteoTienda.put(nombreProd, conteoTienda.getOrDefault(nombreProd, 0) + cantidad);
                        dineroTienda.put(nombreProd, dineroTienda.getOrDefault(nombreProd, 0.0) + subtotal);
                        totalSumaTienda += subtotal;
                    }
                }
            }

            // === DIBUJAR REPORTE ===
            int rowNum = 0;
            Row titleRow = sheet.createRow(rowNum++);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("RESUMEN FINANCIERO DEL DÍA");
            titleCell.setCellStyle(mainTitleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 7));

            rowNum++;

            Row headerRow = sheet.createRow(rowNum++);
            String[] headers = {"PRODUCTO COCINA", "CANT", "TOTAL", "", "", "PRODUCTO TIENDA", "CANT", "TOTAL"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                if (!headers[i].isEmpty()) cell.setCellStyle(greenHeaderStyle);
            }

            List<String> itemsCocina = new ArrayList<>(conteoCocina.keySet());
            List<String> itemsTienda = new ArrayList<>(conteoTienda.keySet());
            int maxFilas = Math.max(itemsCocina.size(), itemsTienda.size());

            for (int i = 0; i < maxFilas; i++) {
                Row row = sheet.createRow(rowNum++);
                if (i < itemsCocina.size()) {
                    String prod = itemsCocina.get(i);
                    crearCelda(row, 0, prod, dataStyle);
                    crearCelda(row, 1, conteoCocina.get(prod), dataStyle);
                    crearCeldaMoneda(row, 2, dineroCocina.get(prod), currencyStyle);
                } else {
                    crearCelda(row, 0, "", dataStyle);
                    crearCelda(row, 1, "", dataStyle);
                    crearCelda(row, 2, "", dataStyle);
                }
                if (i < itemsTienda.size()) {
                    String prod = itemsTienda.get(i);
                    crearCelda(row, 5, prod, dataStyle);
                    crearCelda(row, 6, conteoTienda.get(prod), dataStyle);
                    crearCeldaMoneda(row, 7, dineroTienda.get(prod), currencyStyle);
                } else {
                    crearCelda(row, 5, "", dataStyle);
                    crearCelda(row, 6, "", dataStyle);
                    crearCelda(row, 7, "", dataStyle);
                }
            }

            Row totalRow = sheet.createRow(rowNum++);
            crearCelda(totalRow, 0, "TOTAL COCINA", greenHeaderStyle);
            crearCelda(totalRow, 1, "", greenHeaderStyle);
            crearCeldaMoneda(totalRow, 2, totalSumaCocina, greenTotalCurrencyStyle);
            crearCelda(totalRow, 5, "TOTAL TIENDA", greenHeaderStyle);
            crearCelda(totalRow, 6, "", greenHeaderStyle);
            crearCeldaMoneda(totalRow, 7, totalSumaTienda, greenTotalCurrencyStyle);

            rowNum++;

            Row granTotalRow = sheet.createRow(rowNum);
            granTotalRow.setHeightInPoints(30);
            Cell celdaTexto = granTotalRow.createCell(0);
            celdaTexto.setCellValue("GRAN TOTAL ACUMULADO:");
            celdaTexto.setCellStyle(grandTotalLabelStyle);
            sheet.addMergedRegion(new CellRangeAddress(rowNum, rowNum, 0, 5));
            Cell celdaValor = granTotalRow.createCell(6);
            celdaValor.setCellValue(granTotalDinero);
            celdaValor.setCellStyle(grandTotalStyle);
            sheet.addMergedRegion(new CellRangeAddress(rowNum, rowNum, 6, 7));

            rowNum += 3;

            Row ticketsTitleRow = sheet.createRow(rowNum++);
            Cell tTitle = ticketsTitleRow.createCell(0);
            tTitle.setCellValue("DETALLE DE TRANSACCIONES");
            tTitle.setCellStyle(mainTitleStyle);
            sheet.addMergedRegion(new CellRangeAddress(rowNum-1, rowNum-1, 0, 7));

            Row tHeaderRow = sheet.createRow(rowNum++);
            String[] tHeaders = {"ID", "HORA", "CLIENTE", "TIPO PAGO", "ESTADO", "", "", "TOTAL TICKET"};
            for (int i = 0; i < tHeaders.length; i++) {
                Cell c = tHeaderRow.createCell(i);
                c.setCellValue(tHeaders[i]);
                c.setCellStyle(greenHeaderStyle);
            }

            for (Orden o : ordenes) {
                Row r = sheet.createRow(rowNum++);
                String cliente = o.getCliente() != null ? o.getCliente().getNombre() : (o.getNombreClienteTemporal() != null ? o.getNombreClienteTemporal() : "Anónimo");
                String pago = o.getCliente() != null ? "Billetera" : "Efectivo";

                crearCelda(r, 0, o.getId().intValue(), dataStyle);
                crearCelda(r, 1, o.getFecha().toLocalTime().toString().substring(0,5), dataStyle);
                crearCelda(r, 2, cliente, dataStyle);
                crearCelda(r, 3, pago, dataStyle);
                crearCelda(r, 4, o.getEstado().toString(), dataStyle);
                crearCelda(r, 5, "", dataStyle);
                crearCelda(r, 6, "", dataStyle);
                crearCeldaMoneda(r, 7, o.getTotal().doubleValue(), currencyStyle);
            }

            for (int i = 0; i < 8; i++) sheet.autoSizeColumn(i);
            workbook.write(response.getOutputStream());
        }
    }

    // --- MÉTODOS AUXILIARES EXCEL ---
    private void ponerBordes(CellStyle style) {
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
    }
    private void crearCelda(Row row, int col, Object valor, CellStyle style) {
        Cell cell = row.createCell(col);
        if (valor instanceof String) cell.setCellValue((String) valor);
        else if (valor instanceof Integer) cell.setCellValue((Integer) valor);
        else if (valor instanceof Double) cell.setCellValue((Double) valor);
        if (valor == null || (valor instanceof String && ((String)valor).isEmpty())) cell.setBlank();
        cell.setCellStyle(style);
    }
    private void crearCeldaMoneda(Row row, int col, Double valor, CellStyle style) {
        Cell cell = row.createCell(col);
        if (valor != null) cell.setCellValue(valor);
        cell.setCellStyle(style);
    }

    // --- CLASES AUXILIARES (DTOs) ---
    public static class CrearOrdenRequest {
        private Long eventoId;
        private Long clienteId;
        private String nombreTemporal;
        private List<ProductoOrdenRequest> productos;
        public Long getEventoId() { return eventoId; }
        public void setEventoId(Long eventoId) { this.eventoId = eventoId; }
        public Long getClienteId() { return clienteId; }
        public void setClienteId(Long clienteId) { this.clienteId = clienteId; }
        public String getNombreTemporal() { return nombreTemporal; }
        public void setNombreTemporal(String nombreTemporal) { this.nombreTemporal = nombreTemporal; }
        public List<ProductoOrdenRequest> getProductos() { return productos; }
        public void setProductos(List<ProductoOrdenRequest> productos) { this.productos = productos; }
    }

    public static class ProductoOrdenRequest {
        private Long productoId;
        private Integer cantidad;
        public Long getProductoId() { return productoId; }
        public void setProductoId(Long productoId) { this.productoId = productoId; }
        public Integer getCantidad() { return cantidad; }
        public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }
    }
}