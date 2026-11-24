package pe.edu.upeu.lamb.finanzas.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.upeu.lamb.finanzas.dto.CuentaEstudianteRequest;
import pe.edu.upeu.lamb.finanzas.dto.CuentaEstudianteResponse;
import pe.edu.upeu.lamb.finanzas.entity.CuentaEstudiante;
import pe.edu.upeu.lamb.finanzas.entity.TipoMovimientoCuenta;
import pe.edu.upeu.lamb.finanzas.exception.ResourceNotFoundException;
import pe.edu.upeu.lamb.finanzas.mapper.CuentaEstudianteMapper;
import pe.edu.upeu.lamb.finanzas.repository.CuentaEstudianteRepository;

import java.time.Instant;
import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CuentaEstudianteService {

    private final CuentaEstudianteRepository cuentaEstudianteRepository;
    private final CuentaEstudianteMapper cuentaEstudianteMapper;
    private final SaldoCuentaService saldoCuentaService;

    public List<CuentaEstudianteResponse> listar() {
        return cuentaEstudianteRepository.findAll().stream()
                .map(cuentaEstudianteMapper::toResponse)
                .toList();
    }

    public CuentaEstudianteResponse obtener(Long id) {
        return cuentaEstudianteMapper.toResponse(buscarOFallar(id));
    }

    @Transactional
    public CuentaEstudianteResponse crear(CuentaEstudianteRequest request) {
        // La cuenta abre en 0; un saldo inicial queda como movimiento, asi el saldo
        // siempre se explica con su historial. Positivo = saldo a favor que se le crea al
        // estudiante (ABONO); negativo = deuda inicial (CARGO).
        CuentaEstudiante entity = cuentaEstudianteMapper.toEntity(request);
        entity.setSaldoActual(BigDecimal.ZERO);
        entity.setFechaApertura(Instant.now());
        CuentaEstudiante guardada = cuentaEstudianteRepository.save(entity);
        BigDecimal inicial = request.getSaldoActual();
        if (inicial != null && inicial.signum() != 0) {
            saldoCuentaService.registrar(guardada.getId(),
                    inicial.signum() > 0 ? TipoMovimientoCuenta.ABONO : TipoMovimientoCuenta.CARGO,
                    inicial.abs(), "Saldo inicial", null);
        }
        return cuentaEstudianteMapper.toResponse(guardada);
    }

    @Transactional
    public CuentaEstudianteResponse actualizar(Long id, CuentaEstudianteRequest request) {
        CuentaEstudiante entity = buscarOFallar(id);
        // El saldo no se edita a mano: cambia solo con movimientos y ajustes manuales.
        entity.setIdPersona(request.getIdPersona());
        return cuentaEstudianteMapper.toResponse(cuentaEstudianteRepository.save(entity));
    }

    // Si otro registro lo usa (FK), la base lo impide y el manejador global responde 409
    @Transactional
    public void eliminar(Long id) {
        cuentaEstudianteRepository.delete(buscarOFallar(id));
        cuentaEstudianteRepository.flush();
    }

    private CuentaEstudiante buscarOFallar(Long id) {
        return cuentaEstudianteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cuenta de estudiante no encontrada: " + id));
    }
}
