package pe.edu.upeu.lamb.finanzas.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import pe.edu.upeu.lamb.finanzas.entity.BecaAplicada;
import pe.edu.upeu.lamb.finanzas.entity.DescuentoAplicado;
import pe.edu.upeu.lamb.finanzas.entity.RenovacionSuspensionBeca;
import pe.edu.upeu.lamb.finanzas.entity.TipoMovimientoBeca;
import pe.edu.upeu.lamb.finanzas.repository.BecaAplicadaRepository;
import pe.edu.upeu.lamb.finanzas.repository.DescuentoAplicadoRepository;
import pe.edu.upeu.lamb.finanzas.repository.RenovacionSuspensionBecaRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class CalculoDescuentoServiceTest {

    private static final Long PERSONA = 7L;
    private static final LocalDate HOY = LocalDate.of(2026, 11, 24);
    private static final BigDecimal MONTO = new BigDecimal("350.00");

    private BecaAplicadaRepository becas;
    private DescuentoAplicadoRepository descuentos;
    private RenovacionSuspensionBecaRepository movimientos;
    private CalculoDescuentoService servicio;

    @BeforeEach
    void setUp() {
        becas = mock(BecaAplicadaRepository.class);
        descuentos = mock(DescuentoAplicadoRepository.class);
        movimientos = mock(RenovacionSuspensionBecaRepository.class);
        servicio = new CalculoDescuentoService(becas, descuentos, movimientos);
        when(becas.findByIdPersonaAndFechaInicioLessThanEqual(PERSONA, HOY)).thenReturn(List.of());
        when(descuentos.findByIdPersonaAndFechaInicioLessThanEqual(PERSONA, HOY)).thenReturn(List.of());
        when(movimientos.findFirstByBecaAplicadaIdAndFechaLessThanEqualOrderByFechaDescIdDesc(anyLong(), any()))
                .thenReturn(Optional.empty());
    }

    private BecaAplicada beca(long id, String pct) {
        return BecaAplicada.builder().id(id).idPersona(PERSONA).porcentaje(new BigDecimal(pct)).fechaInicio(HOY).build();
    }

    private DescuentoAplicado descuento(long id, String pct) {
        return DescuentoAplicado.builder().id(id).idPersona(PERSONA).porcentaje(new BigDecimal(pct)).fechaInicio(HOY).build();
    }

    @Test
    void sinBecaNiDescuentoCobraCompleto() {
        var r = servicio.calcular(PERSONA, MONTO, HOY);
        assertThat(r.montoFinal()).isEqualByComparingTo("350.00");
        assertThat(r.montoDescuento()).isEqualByComparingTo("0.00");
    }

    @Test
    void becaVigenteDescuentaSuPorcentaje() {
        when(becas.findByIdPersonaAndFechaInicioLessThanEqual(PERSONA, HOY)).thenReturn(List.of(beca(1, "50")));
        var r = servicio.calcular(PERSONA, MONTO, HOY);
        assertThat(r.montoDescuento()).isEqualByComparingTo("175.00");
        assertThat(r.montoFinal()).isEqualByComparingTo("175.00");
    }

    @Test
    void variasBecasTomaLaMayorSinSumar() {
        when(becas.findByIdPersonaAndFechaInicioLessThanEqual(PERSONA, HOY))
                .thenReturn(List.of(beca(1, "20"), beca(2, "30")));
        var r = servicio.calcular(PERSONA, MONTO, HOY);
        assertThat(r.porcentajeBeca()).isEqualByComparingTo("30");
        assertThat(r.montoFinal()).isEqualByComparingTo("245.00");
    }

    @Test
    void becaSuspendidaNoDescuenta() {
        when(becas.findByIdPersonaAndFechaInicioLessThanEqual(PERSONA, HOY)).thenReturn(List.of(beca(1, "50")));
        when(movimientos.findFirstByBecaAplicadaIdAndFechaLessThanEqualOrderByFechaDescIdDesc(eq(1L), eq(HOY)))
                .thenReturn(Optional.of(RenovacionSuspensionBeca.builder().tipo(TipoMovimientoBeca.SUSPENSION).fecha(HOY).build()));
        var r = servicio.calcular(PERSONA, MONTO, HOY);
        assertThat(r.montoFinal()).isEqualByComparingTo("350.00");
    }

    @Test
    void becaRenovadaDespuesDeSuspensionVuelveADescontar() {
        when(becas.findByIdPersonaAndFechaInicioLessThanEqual(PERSONA, HOY)).thenReturn(List.of(beca(1, "50")));
        when(movimientos.findFirstByBecaAplicadaIdAndFechaLessThanEqualOrderByFechaDescIdDesc(eq(1L), eq(HOY)))
                .thenReturn(Optional.of(RenovacionSuspensionBeca.builder().tipo(TipoMovimientoBeca.RENOVACION).fecha(HOY).build()));
        var r = servicio.calcular(PERSONA, MONTO, HOY);
        assertThat(r.montoFinal()).isEqualByComparingTo("175.00");
    }

    @Test
    void becaMasDescuentoSeSumanConTopeDeCien() {
        when(becas.findByIdPersonaAndFechaInicioLessThanEqual(PERSONA, HOY)).thenReturn(List.of(beca(1, "80")));
        when(descuentos.findByIdPersonaAndFechaInicioLessThanEqual(PERSONA, HOY)).thenReturn(List.of(descuento(1, "40")));
        var r = servicio.calcular(PERSONA, MONTO, HOY);
        assertThat(r.montoFinal()).isEqualByComparingTo("0.00");
        assertThat(r.montoDescuento()).isEqualByComparingTo("350.00");
    }

    @Test
    void descuentoExplicitoSeSumaABeca() {
        when(becas.findByIdPersonaAndFechaInicioLessThanEqual(PERSONA, HOY)).thenReturn(List.of(beca(1, "25")));
        var r = servicio.calcular(PERSONA, new BigDecimal("100.00"), HOY, descuento(5, "10"));
        assertThat(r.montoFinal()).isEqualByComparingTo("65.00");
    }

    @Test
    void redondeaADosDecimales() {
        when(becas.findByIdPersonaAndFechaInicioLessThanEqual(PERSONA, HOY)).thenReturn(List.of(beca(1, "33.33")));
        var r = servicio.calcular(PERSONA, new BigDecimal("100.01"), HOY);
        assertThat(r.montoDescuento()).isEqualByComparingTo("33.33");
        assertThat(r.montoFinal()).isEqualByComparingTo("66.68");
    }
}
