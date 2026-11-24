package pe.edu.upeu.lamb.finanzas.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pe.edu.upeu.lamb.finanzas.entity.BecaAplicada;
import pe.edu.upeu.lamb.finanzas.entity.DescuentoAplicado;
import pe.edu.upeu.lamb.finanzas.entity.TipoMovimientoBeca;
import pe.edu.upeu.lamb.finanzas.repository.BecaAplicadaRepository;
import pe.edu.upeu.lamb.finanzas.repository.DescuentoAplicadoRepository;
import pe.edu.upeu.lamb.finanzas.repository.RenovacionSuspensionBecaRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

/**
 * Calcula cuanto se descuenta de un cargo por becas y descuentos de la persona.
 *
 * Reglas:
 * - Beca vigente: fecha_inicio <= fecha y su ultimo movimiento hasta esa fecha no es SUSPENSION
 *   (una RENOVACION posterior la reactiva).
 * - Si hay varias becas vigentes se toma la de mayor porcentaje (no se suman entre si).
 *   Igual con los descuentos.
 * - Beca + descuento se suman, con tope de 100%.
 * - Montos a 2 decimales, redondeo HALF_UP.
 */
@Service
@RequiredArgsConstructor
public class CalculoDescuentoService {

    private static final BigDecimal CIEN = new BigDecimal("100");

    private final BecaAplicadaRepository becaAplicadaRepository;
    private final DescuentoAplicadoRepository descuentoAplicadoRepository;
    private final RenovacionSuspensionBecaRepository renovacionSuspensionBecaRepository;

    public record Resultado(BigDecimal montoOriginal,
                            BigDecimal porcentajeBeca,
                            BigDecimal porcentajeDescuento,
                            BigDecimal montoDescuento,
                            BigDecimal montoFinal) {
    }

    /** Beca vigente + mejor descuento vigente de la persona. */
    public Resultado calcular(Long idPersona, BigDecimal montoBase, LocalDate fecha) {
        BigDecimal descuento = descuentoAplicadoRepository.findByIdPersonaAndFechaInicioLessThanEqual(idPersona, fecha)
                .stream()
                .map(DescuentoAplicado::getPorcentaje)
                .max(Comparator.naturalOrder())
                .orElse(BigDecimal.ZERO);
        return aplicar(montoBase, porcentajeBecaVigente(idPersona, fecha), descuento);
    }

    /** Beca vigente de la persona + un descuento elegido explicitamente (puede ser null). */
    public Resultado calcular(Long idPersona, BigDecimal montoBase, LocalDate fecha, DescuentoAplicado descuento) {
        BigDecimal porcentajeDescuento = descuento != null ? descuento.getPorcentaje() : BigDecimal.ZERO;
        return aplicar(montoBase, porcentajeBecaVigente(idPersona, fecha), porcentajeDescuento);
    }

    public BigDecimal porcentajeBecaVigente(Long idPersona, LocalDate fecha) {
        List<BecaAplicada> becas = becaAplicadaRepository.findByIdPersonaAndFechaInicioLessThanEqual(idPersona, fecha);
        return becas.stream()
                .filter(beca -> !estaSuspendida(beca, fecha))
                .map(BecaAplicada::getPorcentaje)
                .max(Comparator.naturalOrder())
                .orElse(BigDecimal.ZERO);
    }

    private boolean estaSuspendida(BecaAplicada beca, LocalDate fecha) {
        return renovacionSuspensionBecaRepository
                .findFirstByBecaAplicadaIdAndFechaLessThanEqualOrderByFechaDescIdDesc(beca.getId(), fecha)
                .map(mov -> mov.getTipo() == TipoMovimientoBeca.SUSPENSION)
                .orElse(false);
    }

    private Resultado aplicar(BigDecimal montoBase, BigDecimal porcentajeBeca, BigDecimal porcentajeDescuento) {
        BigDecimal original = montoBase.setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = porcentajeBeca.add(porcentajeDescuento).min(CIEN).max(BigDecimal.ZERO);
        BigDecimal montoDescuento = original.multiply(total)
                .divide(CIEN, 2, RoundingMode.HALF_UP);
        return new Resultado(original, porcentajeBeca, porcentajeDescuento, montoDescuento,
                original.subtract(montoDescuento));
    }
}
