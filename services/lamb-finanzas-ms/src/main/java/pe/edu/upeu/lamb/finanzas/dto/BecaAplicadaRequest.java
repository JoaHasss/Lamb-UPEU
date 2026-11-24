package pe.edu.upeu.lamb.finanzas.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class BecaAplicadaRequest {

    // JALA ID DE USUARIOS/PERSONAS: la persona/estudiante es dato propio de otro microservicio.
    @NotNull
    private Long idPersona;

    @NotNull
    private Long idTipoBeca;

    @NotNull
    @DecimalMin(value = "0.00", message = "El porcentaje no puede ser negativo")
    @DecimalMax(value = "100.00", message = "El porcentaje no puede superar 100")
    private BigDecimal porcentaje;

    @NotNull
    private LocalDate fechaInicio;
}
