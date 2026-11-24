package pe.edu.upeu.lamb.finanzas.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.upeu.lamb.finanzas.dto.SolicitudDevolucionRequest;
import pe.edu.upeu.lamb.finanzas.dto.SolicitudDevolucionResponse;
import pe.edu.upeu.lamb.finanzas.entity.EstadoPago;
import pe.edu.upeu.lamb.finanzas.entity.EstadoSolicitudDevolucion;
import pe.edu.upeu.lamb.finanzas.entity.Pago;
import pe.edu.upeu.lamb.finanzas.entity.SolicitudDevolucion;
import pe.edu.upeu.lamb.finanzas.exception.BusinessRuleException;
import pe.edu.upeu.lamb.finanzas.exception.ResourceNotFoundException;
import pe.edu.upeu.lamb.finanzas.mapper.SolicitudDevolucionMapper;
import pe.edu.upeu.lamb.finanzas.repository.PagoRepository;
import pe.edu.upeu.lamb.finanzas.repository.ReembolsoPagoRepository;
import pe.edu.upeu.lamb.finanzas.repository.SolicitudDevolucionRepository;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SolicitudDevolucionService {

    private final SolicitudDevolucionRepository solicitudDevolucionRepository;
    private final PagoRepository pagoRepository;
    private final ReembolsoPagoRepository reembolsoPagoRepository;
    private final SolicitudDevolucionMapper solicitudDevolucionMapper;

    public List<SolicitudDevolucionResponse> listar() {
        return solicitudDevolucionRepository.findAll().stream()
                .map(solicitudDevolucionMapper::toResponse)
                .toList();
    }

    public SolicitudDevolucionResponse obtener(Long id) {
        return solicitudDevolucionMapper.toResponse(buscarOFallar(id));
    }

    public SolicitudDevolucionResponse crear(SolicitudDevolucionRequest request) {
        Pago pago = pagoRepository.findById(request.getIdPago())
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro el pago con id " + request.getIdPago()));
        validarPagoDevolvible(pago, request, true);
        // Una sola solicitud viva por pago: PENDIENTE o APROBADA. Tras una RECHAZADA se puede pedir de nuevo.
        if (solicitudDevolucionRepository.existsByPagoIdAndEstadoIn(pago.getId(),
                List.of(EstadoSolicitudDevolucion.PENDIENTE, EstadoSolicitudDevolucion.APROBADA))) {
            throw new BusinessRuleException("El pago " + pago.getId() + " ya tiene una solicitud de devolucion pendiente o aprobada");
        }

        SolicitudDevolucion entity = SolicitudDevolucion.builder()
                .pago(pago)
                .motivo(request.getMotivo())
                .montoSolicitado(request.getMontoSolicitado())
                .estado(request.getEstado())
                .fecha(request.getFecha())
                .build();

        return solicitudDevolucionMapper.toResponse(solicitudDevolucionRepository.save(entity));
    }

    @Transactional
    public SolicitudDevolucionResponse actualizar(Long id, SolicitudDevolucionRequest request) {
        SolicitudDevolucion entity = buscarOFallar(id);
        // Con el reembolso ya hecho la solicitud queda cerrada
        if (reembolsoPagoRepository.existsBySolicitudDevolucionId(id)) {
            throw new BusinessRuleException("La solicitud " + id + " ya tiene un reembolso registrado: no se puede modificar");
        }
        Pago pago = pagoRepository.findById(request.getIdPago())
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro el pago con id " + request.getIdPago()));
        validarPagoDevolvible(pago, request, !pago.getId().equals(entity.getPago().getId()));
        entity.setPago(pago);
        entity.setMotivo(request.getMotivo());
        entity.setMontoSolicitado(request.getMontoSolicitado());
        entity.setEstado(request.getEstado());
        entity.setFecha(request.getFecha());
        return solicitudDevolucionMapper.toResponse(solicitudDevolucionRepository.save(entity));
    }

    // Si otro registro lo usa (FK), la base lo impide y el manejador global responde 409
    @Transactional
    public void eliminar(Long id) {
        solicitudDevolucionRepository.delete(buscarOFallar(id));
        solicitudDevolucionRepository.flush();
    }

    /**
     * Solo se devuelve dinero cobrado: el pago debe estar APROBADO (un PENDIENTE, EN_PROCESO o
     * RECHAZADO no cobro nada) y no se puede pedir mas de lo que se pago.
     */
    private void validarPagoDevolvible(Pago pago, SolicitudDevolucionRequest request, boolean exigirAprobado) {
        if (exigirAprobado && pago.getEstado() != EstadoPago.APROBADO) {
            throw new BusinessRuleException("Solo se puede pedir la devolucion de un pago APROBADO; el pago "
                    + pago.getId() + " esta " + pago.getEstado());
        }
        if (request.getMontoSolicitado().signum() <= 0) {
            throw new BusinessRuleException("El monto solicitado debe ser mayor a 0");
        }
        if (request.getMontoSolicitado().compareTo(pago.getMonto()) > 0) {
            throw new BusinessRuleException("El monto solicitado (S/ " + request.getMontoSolicitado()
                    + ") supera lo pagado (S/ " + pago.getMonto() + ")");
        }
    }

    private SolicitudDevolucion buscarOFallar(Long id) {
        return solicitudDevolucionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro la solicitud de devolucion con id " + id));
    }
}
