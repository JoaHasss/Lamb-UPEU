package pe.edu.upeu.lamb.finanzas.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import pe.edu.upeu.lamb.finanzas.dto.PagoPasarelaRequest;
import pe.edu.upeu.lamb.finanzas.dto.PagoRequest;
import pe.edu.upeu.lamb.finanzas.dto.PagoResponse;
import pe.edu.upeu.lamb.finanzas.dto.PreferenciaPagoResponse;
import pe.edu.upeu.lamb.finanzas.service.PagoService;
import pe.edu.upeu.lamb.finanzas.service.PasarelaPagoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Collection;
import java.util.List;
import java.util.Map;

/**
 * Dominio "Pagos" (CRUD unificado). Base {@code /api/v1/pagos} preservada
 * sin cambios por ser parte de la saga de matricula-finanzas.
 */
@RestController
@RequestMapping("/api/v1/pagos")
@RequiredArgsConstructor
@Tag(name = "pagos-controller")
public class PagoController {

    private final PagoService pagoService;
    private final PasarelaPagoService pasarelaPagoService;

    @GetMapping
    @Operation(summary = "Listar pagos (ESTUDIANTE solo ve los suyos)")
    public List<PagoResponse> listar(@AuthenticationPrincipal Jwt jwt) {
        return pagoService.listar(idPersonaDe(jwt), esPrivilegiado(jwt));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener un pago (ESTUDIANTE solo si es suyo)")
    public PagoResponse obtener(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return pagoService.obtener(id, idPersonaDe(jwt), esPrivilegiado(jwt));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Procesar un pago")
    public PagoResponse procesar(@Valid @RequestBody PagoRequest request) {
        return pagoService.procesar(request);
    }

    @PostMapping("/{id}/reembolsar")
    @Operation(summary = "Reembolsar un pago")
    public PagoResponse reembolsar(@PathVariable Long id) {
        return pagoService.reembolsar(id);
    }

    @PostMapping("/{id}/pasarela")
    @Operation(summary = "Pagar un pago EN_PROCESO con tarjeta via Mercado Pago (Payments API)")
    public PagoResponse pagarConPasarela(@PathVariable Long id, @Valid @RequestBody PagoPasarelaRequest request) {
        return pasarelaPagoService.pagarConTarjeta(id, request.getCardToken(), request.getPayerEmail());
    }

    @PostMapping("/{id}/preferencia")
    @Operation(summary = "Generar preferencia de Checkout Pro: redirigir al navegador a initPoint para pagar")
    public PreferenciaPagoResponse crearPreferencia(@PathVariable Long id) {
        return pasarelaPagoService.crearPreferencia(id);
    }

    @PostMapping("/{id}/confirmar-mercadopago")
    @Operation(summary = "Confirmar un pago tras volver del Checkout Pro (payment_id que Mercado Pago agrega a la back_url)")
    public PagoResponse confirmarMercadoPago(@PathVariable Long id, @RequestParam Long paymentId) {
        return pasarelaPagoService.confirmarPago(id, paymentId);
    }

    @PostMapping("/{id}/aceptar")
    @Operation(summary = "Aceptar un pago en proceso")
    public PagoResponse aceptar(@PathVariable Long id) {
        return pagoService.aceptar(id);
    }

    @PostMapping("/{id}/rechazar")
    @Operation(summary = "Rechazar un pago en proceso")
    public PagoResponse rechazar(@PathVariable Long id) {
        return pagoService.rechazar(id);
    }

    // idPersona viaja en el token via protocol mapper (lamb-realm.json); ADMIN/COORDINADOR
    // ven todo, ESTUDIANTE solo lo suyo (aislamiento por fila, el Gateway solo filtra por rol).
    // Sin jwt (seguridad TEMPORAL desactivada, ver CONTEXTO_SESION.md seccion 7): se trata como
    // privilegiado para no romper el listado mientras no hay login.
    private static Long idPersonaDe(Jwt jwt) {
        return jwt == null ? null : jwt.getClaim("idPersona");
    }

    private static boolean esPrivilegiado(Jwt jwt) {
        if (jwt == null) {
            return true;
        }
        Map<String, Object> realmAccess = jwt.getClaimAsMap("realm_access");
        Object roles = realmAccess == null ? null : realmAccess.get("roles");
        if (!(roles instanceof Collection<?> lista)) {
            return false;
        }
        return lista.contains("ADMIN") || lista.contains("COORDINADOR");
    }
}
