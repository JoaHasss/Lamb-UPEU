package pe.edu.upeu.lamb.finanzas.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class CuentaEstudianteRequest {

    @NotNull
    private Long idPersona;

    // Opcional y solo al crear: queda como movimiento "Saldo inicial". Al editar se ignora.
    private BigDecimal saldoActual;
}
