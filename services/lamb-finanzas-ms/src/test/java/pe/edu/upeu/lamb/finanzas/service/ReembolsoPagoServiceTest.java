package pe.edu.upeu.lamb.finanzas.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import pe.edu.upeu.lamb.finanzas.dto.ReembolsoPagoRequest;
import pe.edu.upeu.lamb.finanzas.entity.CuentaEstudiante;
import pe.edu.upeu.lamb.finanzas.entity.EstadoPago;
import pe.edu.upeu.lamb.finanzas.entity.EstadoSolicitudDevolucion;
import pe.edu.upeu.lamb.finanzas.entity.Pago;
import pe.edu.upeu.lamb.finanzas.entity.ReembolsoPago;
import pe.edu.upeu.lamb.finanzas.entity.SolicitudDevolucion;
import pe.edu.upeu.lamb.finanzas.exception.BusinessRuleException;
import pe.edu.upeu.lamb.finanzas.mapper.ReembolsoPagoMapper;
import pe.edu.upeu.lamb.finanzas.repository.CuentaEstudianteRepository;
import pe.edu.upeu.lamb.finanzas.repository.PagoRepository;
import pe.edu.upeu.lamb.finanzas.repository.ReembolsoPagoRepository;
import pe.edu.upeu.lamb.finanzas.repository.SolicitudDevolucionRepository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ReembolsoPagoServiceTest {

    private ReembolsoPagoRepository reembolsos;
    private SolicitudDevolucionRepository solicitudes;
    private CuentaEstudianteRepository cuentas;
    private ReembolsoPagoService servicio;
    private Pago pago;
    private SolicitudDevolucion solicitud;

    @BeforeEach
    void setUp() {
        reembolsos = mock(ReembolsoPagoRepository.class);
        solicitudes = mock(SolicitudDevolucionRepository.class);
        cuentas = mock(CuentaEstudianteRepository.class);
        PagoRepository pagos = mock(PagoRepository.class);
        servicio = new ReembolsoPagoService(reembolsos, solicitudes, cuentas, pagos, mock(ReembolsoPagoMapper.class));

        pago = Pago.builder().id(9L).idPersona(5L).monto(new BigDecimal("45.00")).estado(EstadoPago.APROBADO).build();
        solicitud = SolicitudDevolucion.builder().id(1L).pago(pago).montoSolicitado(new BigDecimal("45.00"))
                .estado(EstadoSolicitudDevolucion.APROBADA).build();
        when(solicitudes.findById(1L)).thenReturn(Optional.of(solicitud));
        when(cuentas.findById(5L)).thenReturn(Optional.of(CuentaEstudiante.builder().id(5L).idPersona(5L).build()));
        when(cuentas.findById(2L)).thenReturn(Optional.of(CuentaEstudiante.builder().id(2L).idPersona(2L).build()));
        when(reembolsos.save(any())).thenAnswer(i -> i.getArgument(0));
    }

    private ReembolsoPagoRequest request(long idCuenta, String monto) {
        ReembolsoPagoRequest r = new ReembolsoPagoRequest();
        r.setIdSolicitudDevolucion(1L);
        r.setIdCuentaEstudiante(idCuenta);
        r.setMontoReembolsado(new BigDecimal(monto));
        r.setFecha(Instant.now());
        return r;
    }

    @Test
    void reembolsoDeSolicitudAprobadaMarcaPagoReembolsado() {
        servicio.crear(request(5L, "45.00"));
        assertThat(pago.getEstado()).isEqualTo(EstadoPago.REEMBOLSADO);
        verify(reembolsos).save(any());
    }

    @Test
    void solicitudPendienteNoSeReembolsa() {
        solicitud.setEstado(EstadoSolicitudDevolucion.PENDIENTE);
        assertThatThrownBy(() -> servicio.crear(request(5L, "45.00"))).isInstanceOf(BusinessRuleException.class);
        assertThat(pago.getEstado()).isEqualTo(EstadoPago.APROBADO);
        verify(reembolsos, never()).save(any());
    }

    @Test
    void noSeReembolsaDosVeces() {
        when(reembolsos.existsBySolicitudDevolucionId(1L)).thenReturn(true);
        assertThatThrownBy(() -> servicio.crear(request(5L, "45.00"))).isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void montoMayorALoSolicitadoSeRechaza() {
        assertThatThrownBy(() -> servicio.crear(request(5L, "50.00"))).isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void cuentaDeOtraPersonaSeRechaza() {
        assertThatThrownBy(() -> servicio.crear(request(2L, "45.00"))).isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void eliminarReembolsoDevuelvePagoAAprobado() {
        pago.setEstado(EstadoPago.REEMBOLSADO);
        when(reembolsos.findById(1L)).thenReturn(Optional.of(ReembolsoPago.builder().id(1L).solicitudDevolucion(solicitud).build()));
        servicio.eliminar(1L);
        assertThat(pago.getEstado()).isEqualTo(EstadoPago.APROBADO);
    }
}
