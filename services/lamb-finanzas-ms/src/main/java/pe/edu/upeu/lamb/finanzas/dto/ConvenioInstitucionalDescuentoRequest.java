package pe.edu.upeu.lamb.finanzas.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * CRUD opcional: depende de la universidad.
 */
@Getter
@Setter
public class ConvenioInstitucionalDescuentoRequest {

    @NotNull
    @Size(max = 150)
    private String nombreInstitucion;

    @NotNull
    @DecimalMin(value = "0.00", message = "El porcentaje no puede ser negativo")
    @DecimalMax(value = "100.00", message = "El porcentaje no puede superar 100")
    private BigDecimal porcentajeDescuento;
}
