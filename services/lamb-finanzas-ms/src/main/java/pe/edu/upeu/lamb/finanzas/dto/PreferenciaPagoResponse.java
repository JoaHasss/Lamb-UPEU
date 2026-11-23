package pe.edu.upeu.lamb.finanzas.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/** Preferencia de Checkout Pro: el frontend redirige al navegador a initPoint para que el usuario pague. */
@Getter
@AllArgsConstructor
public class PreferenciaPagoResponse {
    private final String preferenceId;
    private final String initPoint;
    private final String sandboxInitPoint;
}
