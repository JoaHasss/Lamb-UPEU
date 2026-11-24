package pe.edu.upeu.lamb.finanzas.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.upeu.lamb.finanzas.dto.MovimientoCuentaRequest;
import pe.edu.upeu.lamb.finanzas.dto.MovimientoCuentaResponse;
import pe.edu.upeu.lamb.finanzas.entity.MovimientoCuenta;
import pe.edu.upeu.lamb.finanzas.exception.ResourceNotFoundException;
import pe.edu.upeu.lamb.finanzas.mapper.MovimientoCuentaMapper;
import pe.edu.upeu.lamb.finanzas.repository.MovimientoCuentaRepository;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MovimientoCuentaService {

    private final MovimientoCuentaRepository movimientoCuentaRepository;
    private final SaldoCuentaService saldoCuentaService;
    private final MovimientoCuentaMapper movimientoCuentaMapper;

    public List<MovimientoCuentaResponse> listar() {
        return movimientoCuentaRepository.findAll().stream()
                .map(movimientoCuentaMapper::toResponse)
                .toList();
    }

    public MovimientoCuentaResponse obtener(Long id) {
        return movimientoCuentaMapper.toResponse(buscarOFallar(id));
    }

    @Transactional
    public MovimientoCuentaResponse crear(MovimientoCuentaRequest request) {
        // Actualiza el saldo: CARGO suma a la deuda, ABONO la resta
        MovimientoCuenta entity = saldoCuentaService.registrar(
                request.getIdCuenta(), request.getTipo(), request.getMonto(), request.getConcepto(), null);
        return movimientoCuentaMapper.toResponse(entity);
    }

    private MovimientoCuenta buscarOFallar(Long id) {
        return movimientoCuentaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Movimiento de cuenta no encontrado: " + id));
    }
}
