package pe.edu.upeu.lamb.finanzas.service;

import com.mercadopago.client.order.OrderClient;
import com.mercadopago.client.order.OrderCreateRequest;
import com.mercadopago.client.order.OrderPayerRequest;
import com.mercadopago.client.order.OrderPaymentMethodRequest;
import com.mercadopago.client.order.OrderPaymentRequest;
import com.mercadopago.client.order.OrderTransactionRequest;
import com.mercadopago.client.payment.PaymentClient;
import com.mercadopago.client.preference.PreferenceBackUrlsRequest;
import com.mercadopago.client.preference.PreferenceClient;
import com.mercadopago.client.preference.PreferenceItemRequest;
import com.mercadopago.client.preference.PreferenceRequest;
import com.mercadopago.exceptions.MPApiException;
import com.mercadopago.exceptions.MPException;
import com.mercadopago.resources.order.Order;
import com.mercadopago.resources.order.OrderPayment;
import com.mercadopago.resources.payment.Payment;
import com.mercadopago.resources.preference.Preference;
import pe.edu.upeu.lamb.finanzas.client.IngresosPagosPasarelaClient;
import pe.edu.upeu.lamb.finanzas.config.MercadoPagoProperties;
import pe.edu.upeu.lamb.finanzas.dto.PagoResponse;
import pe.edu.upeu.lamb.finanzas.dto.PreferenciaPagoResponse;
import pe.edu.upeu.lamb.finanzas.entity.EstadoPago;
import pe.edu.upeu.lamb.finanzas.entity.MetodoPago;
import pe.edu.upeu.lamb.finanzas.entity.Pago;
import pe.edu.upeu.lamb.finanzas.event.PagoAceptadoEvento;
import pe.edu.upeu.lamb.finanzas.exception.BusinessRuleException;
import pe.edu.upeu.lamb.finanzas.exception.ResourceNotFoundException;
import pe.edu.upeu.lamb.finanzas.mapper.PagoMapper;
import pe.edu.upeu.lamb.finanzas.messaging.PagoEventosProducer;
import pe.edu.upeu.lamb.finanzas.repository.PagoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * Pago con tarjeta via Mercado Pago. Integraciones:
 * - Orders API directa (pagarConTarjeta): el frontend tokeniza la tarjeta con el SDK JS de MP
 *   usando la public key, y aqui solo llega el cardToken. Reemplaza a la antigua Payments API
 *   (/v1/payments), que esta cuenta rechaza con "Unauthorized use of live credentials" aunque
 *   las credenciales sean correctas (restriccion de cuenta, no de codigo).
 * - Checkout Pro (crearPreferencia / confirmarPago): se genera una preferencia y el navegador
 *   se redirige a Mercado Pago, que cobra la tarjeta en su propia pagina; al volver (back_url)
 *   el frontend llama a confirmarPago con el id de pago que Mercado Pago le paso por query param.
 * El log de la transaccion (LogTransaccionPasarela) vive en lamb-ingresos-pagos-ms, por eso
 * la llamada M2M via IngresosPagosPasarelaClient tras cada intento.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PasarelaPagoService {

    private static final String PROVEEDOR = "MERCADOPAGO";

    private final PagoRepository pagoRepository;
    private final PagoMapper pagoMapper;
    private final PagoEventosProducer pagoEventosProducer;
    private final IngresosPagosPasarelaClient pasarelaClient;
    private final MercadoPagoProperties propiedades;
    private final SaldoCuentaService saldoCuentaService;

    @Transactional
    public PagoResponse pagarConTarjeta(Long idPago, String cardToken, String payerEmail) {
        Pago pago = buscarEnProceso(idPago);
        Order orden = crearOrdenEnMercadoPago(pago, cardToken, payerEmail);
        OrderPayment pagoOrden = orden.getTransactions().getPayments().get(0);
        return aplicarResultado(pago, MetodoPago.TARJETA, pagoOrden.getId(), pagoOrden.getStatus(), pagoOrden.getStatusDetail());
    }

    public PreferenciaPagoResponse crearPreferencia(Long idPago) {
        // Un cargo PENDIENTE (p.ej. el de una matricula) tambien se puede pagar: al crear la
        // preferencia pasa a EN_PROCESO con metodo MERCADOPAGO.
        Pago pago = buscarPagable(idPago);

        PreferenceItemRequest item = PreferenceItemRequest.builder()
                .title(pago.getConcepto())
                .quantity(1)
                .unitPrice(pago.getMonto())
                .build();
        // pagoId va en la propia back_url: es la unica forma de que la pantalla de retorno sepa
        // que pago confirmar (Mercado Pago no reenvia el external_reference como query param).
        String sufijo = "?pagoId=" + pago.getId();
        PreferenceBackUrlsRequest backUrls = PreferenceBackUrlsRequest.builder()
                .success(propiedades.getBackUrlSuccess() + sufijo)
                .pending(propiedades.getBackUrlPending() + sufijo)
                .failure(propiedades.getBackUrlFailure() + sufijo)
                .build();
        // auto_return exige que back_url.success sea una URL publica https; en localhost (dev)
        // Mercado Pago lo rechaza, asi que se omite (el usuario vuelve con un boton manual).
        PreferenceRequest request = PreferenceRequest.builder()
                .items(List.of(item))
                .backUrls(backUrls)
                .externalReference("pago-" + pago.getId())
                .notificationUrl(propiedades.getNotificationUrl())
                .build();

        try {
            Preference preferencia = new PreferenceClient().create(request);
            if (pago.getEstado() == EstadoPago.PENDIENTE) {
                pago.setEstado(EstadoPago.EN_PROCESO);
                pago.setMetodo(MetodoPago.MERCADOPAGO);
                pagoRepository.save(pago);
            }
            return new PreferenciaPagoResponse(preferencia.getId(), preferencia.getInitPoint(), preferencia.getSandboxInitPoint());
        } catch (MPApiException e) {
            log.error("component=pasarela pagoId={} accion=preferencia status=error httpStatus={} motivo=\"{}\"",
                    pago.getId(), e.getApiResponse().getStatusCode(), e.getApiResponse().getContent());
            throw new BusinessRuleException("Mercado Pago rechazo la creacion de la preferencia: " + e.getApiResponse().getContent());
        } catch (MPException e) {
            log.error("component=pasarela pagoId={} accion=preferencia status=error motivo=\"{}\"", pago.getId(), e.getMessage());
            throw new BusinessRuleException("Error al conectar con Mercado Pago: " + e.getMessage());
        }
    }

    /** Llamado por el frontend al volver del Checkout Pro (back_url trae payment_id en la URL). */
    @Transactional
    public PagoResponse confirmarPago(Long idPago, Long mpPaymentId) {
        Pago pago = buscarEnProceso(idPago);
        try {
            Payment resultado = new PaymentClient().get(mpPaymentId);
            MetodoPago metodoReal = metodoDesdeMercadoPago(resultado.getPaymentMethodId(), resultado.getPaymentTypeId());
            return aplicarResultado(pago, metodoReal, String.valueOf(resultado.getId()), resultado.getStatus(), resultado.getStatusDetail());
        } catch (MPApiException e) {
            log.error("component=pasarela pagoId={} accion=confirmar status=error httpStatus={} motivo=\"{}\"",
                    pago.getId(), e.getApiResponse().getStatusCode(), e.getApiResponse().getContent());
            throw new BusinessRuleException("Mercado Pago rechazo la consulta del pago: " + e.getApiResponse().getContent());
        } catch (MPException e) {
            log.error("component=pasarela pagoId={} accion=confirmar status=error motivo=\"{}\"", pago.getId(), e.getMessage());
            throw new BusinessRuleException("Error al conectar con Mercado Pago: " + e.getMessage());
        }
    }

    private Pago buscarPagable(Long idPago) {
        Pago pago = pagoRepository.findById(idPago)
                .orElseThrow(() -> new ResourceNotFoundException("Pago no encontrado: " + idPago));
        if (pago.getEstado() != EstadoPago.PENDIENTE && pago.getEstado() != EstadoPago.EN_PROCESO) {
            throw new BusinessRuleException("No se puede pagar con pasarela el pago " + idPago
                    + ": esta en estado " + pago.getEstado() + ", se esperaba PENDIENTE o EN_PROCESO");
        }
        return pago;
    }

    private Pago buscarEnProceso(Long idPago) {
        Pago pago = pagoRepository.findById(idPago)
                .orElseThrow(() -> new ResourceNotFoundException("Pago no encontrado: " + idPago));
        if (pago.getEstado() != EstadoPago.EN_PROCESO) {
            throw new BusinessRuleException("No se puede pagar con pasarela el pago " + idPago
                    + ": esta en estado " + pago.getEstado() + ", se esperaba EN_PROCESO");
        }
        return pago;
    }

    /**
     * Traduce el metodo que el usuario eligio en Checkout Pro (payment_method_id / payment_type_id
     * de Mercado Pago) a nuestro MetodoPago, para que el pago no quede como "MERCADOPAGO" generico.
     */
    static MetodoPago metodoDesdeMercadoPago(String paymentMethodId, String paymentTypeId) {
        if ("yape".equalsIgnoreCase(paymentMethodId)) {
            return MetodoPago.YAPE;
        }
        if (paymentTypeId == null) {
            return MetodoPago.MERCADOPAGO;
        }
        return switch (paymentTypeId) {
            case "credit_card", "debit_card", "prepaid_card" -> MetodoPago.TARJETA;
            case "ticket", "atm" -> MetodoPago.EFECTIVO; // PagoEfectivo / agentes
            case "bank_transfer" -> MetodoPago.TRANSFERENCIA;
            default -> MetodoPago.MERCADOPAGO; // account_money (saldo MP) u otros
        };
    }

    private PagoResponse aplicarResultado(Pago pago, MetodoPago metodo, String referenciaExterna, String estadoMp, String detalleMp) {
        // "approved": Payments API clasica (confirmarPago via Checkout Pro). "processed"+"accredited":
        // Orders API (pagarConTarjeta) - mismo resultado, nombres de estado distintos.
        boolean aprobado = "approved".equals(estadoMp) || ("processed".equals(estadoMp) && "accredited".equals(detalleMp));

        // "pending"/"in_process" (ej. PagoEfectivo aun no pagado en agente, o tarjeta en revision):
        // el pago sigue EN_PROCESO para poder confirmarlo despues, no se rechaza.
        boolean pendiente = "pending".equals(estadoMp) || "in_process".equals(estadoMp);

        pago.setMetodo(metodo);
        pago.setReferenciaExterna(referenciaExterna);
        pago.setEstado(aprobado ? EstadoPago.APROBADO : pendiente ? EstadoPago.EN_PROCESO : EstadoPago.RECHAZADO);
        Pago guardado = pagoRepository.save(pago);
        if (aprobado) {
            saldoCuentaService.abonarPago(guardado);
        } else if (!pendiente && guardado.getMatriculaId() == null) {
            saldoCuentaService.anularCargoPago(guardado, "Pago rechazado, se anula el cargo");
        }

        registrarLog(guardado.getId(), referenciaExterna, estadoMp, detalleMp);

        if (aprobado) {
            pagoEventosProducer.publicarTrasCommit(PagoAceptadoEvento.builder()
                    .tipoEvento("pago.aceptado")
                    .idPago(guardado.getId())
                    .matriculaId(guardado.getMatriculaId())
                    .idPersona(guardado.getIdPersona())
                    .monto(guardado.getMonto())
                    .fechaAceptacion(Instant.now())
                    .build());
        }

        return pagoMapper.toResponse(guardado);
    }

    private Order crearOrdenEnMercadoPago(Pago pago, String cardToken, String payerEmail) {
        String monto = pago.getMonto().toPlainString();

        // id = marca de la tarjeta (master, visa, amex...). La Orders API, a diferencia de la
        // antigua Payments API, no la infiere sola del token: hay que mandarla si o si.
        OrderPaymentMethodRequest metodoPago = OrderPaymentMethodRequest.builder()
                .id("master")
                .type("credit_card")
                .token(cardToken)
                .installments(1)
                .build();
        OrderPaymentRequest pagoOrden = OrderPaymentRequest.builder()
                .amount(monto)
                .paymentMethod(metodoPago)
                .build();
        OrderCreateRequest request = OrderCreateRequest.builder()
                .type("online")
                .totalAmount(monto)
                .description(pago.getConcepto())
                .externalReference("pago-" + pago.getId())
                .payer(OrderPayerRequest.builder().email(payerEmail).build())
                .transactions(OrderTransactionRequest.builder().payments(List.of(pagoOrden)).build())
                .build();

        try {
            return new OrderClient().create(request);
        } catch (MPApiException e) {
            log.error("component=pasarela pagoId={} status=error httpStatus={} motivo=\"{}\"",
                    pago.getId(), e.getApiResponse().getStatusCode(), e.getApiResponse().getContent());
            throw new BusinessRuleException("Mercado Pago rechazo la solicitud: " + e.getApiResponse().getContent());
        } catch (MPException e) {
            log.error("component=pasarela pagoId={} status=error motivo=\"{}\"", pago.getId(), e.getMessage());
            throw new BusinessRuleException("Error al conectar con Mercado Pago: " + e.getMessage());
        }
    }

    private void registrarLog(Long idPago, String referenciaExterna, String estadoMp, String detalleMp) {
        String payload = "{\"id\":\"" + referenciaExterna
                + "\",\"status\":\"" + estadoMp
                + "\",\"status_detail\":\"" + detalleMp + "\"}";
        try {
            pasarelaClient.registrar(idPago, PROVEEDOR, referenciaExterna, estadoMp, payload);
        } catch (Exception e) {
            log.warn("component=pasarela pagoId={} status=log_failed motivo=\"{}\"", idPago, e.getMessage());
        }
    }
}
