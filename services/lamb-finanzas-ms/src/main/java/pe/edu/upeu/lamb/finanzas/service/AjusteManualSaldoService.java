package pe.edu.upeu.lamb.finanzas.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.upeu.lamb.finanzas.dto.AjusteManualSaldoRequest;
import pe.edu.upeu.lamb.finanzas.dto.AjusteManualSaldoResponse;
import pe.edu.upeu.lamb.finanzas.entity.AjusteManualSaldo;
import pe.edu.upeu.lamb.finanzas.exception.BusinessRuleException;
import pe.edu.upeu.lamb.finanzas.entity.TipoMovimientoCuenta;
import pe.edu.upeu.lamb.finanzas.exception.ResourceNotFoundException;
import pe.edu.upeu.lamb.finanzas.mapper.AjusteManualSaldoMapper;
import pe.edu.upeu.lamb.finanzas.repository.AjusteManualSaldoRepository;

import java.time.Instant;
import java.util.List;

/**
 * CRUD marcado con (*) en el documento: ajuste manual requiere autorizacion.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AjusteManualSaldoService {

    private final AjusteManualSaldoRepository ajusteManualSaldoRepository;
    private final AjusteManualSaldoMapper ajusteManualSaldoMapper;
    private final SaldoCuentaService saldoCuentaService;

    public List<AjusteManualSaldoResponse> listar() {
        return ajusteManualSaldoRepository.findAll().stream()
                .map(ajusteManualSaldoMapper::toResponse)
                .toList();
    }

    public AjusteManualSaldoResponse obtener(Long id) {
        return ajusteManualSaldoMapper.toResponse(buscarOFallar(id));
    }

    @Transactional
    public AjusteManualSaldoResponse crear(AjusteManualSaldoRequest request) {
        if (request.getMonto().signum() == 0) {
            throw new BusinessRuleException("El monto del ajuste no puede ser 0");
        }
        // Positivo: mas saldo a favor para el estudiante (ABONO). Negativo: menos saldo a favor (CARGO).
        TipoMovimientoCuenta tipo = request.getMonto().signum() > 0 ? TipoMovimientoCuenta.ABONO : TipoMovimientoCuenta.CARGO;
        saldoCuentaService.registrar(request.getIdCuenta(), tipo, request.getMonto().abs(),
                "Ajuste manual: " + request.getMotivo(), null);
        AjusteManualSaldo entity = ajusteManualSaldoMapper.toEntity(request);
        entity.setFecha(Instant.now());
        return ajusteManualSaldoMapper.toResponse(ajusteManualSaldoRepository.save(entity));
    }

    private AjusteManualSaldo buscarOFallar(Long id) {
        return ajusteManualSaldoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ajuste manual de saldo no encontrado: " + id));
    }
}
