package pe.edu.upeu.lamb.finanzas.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.upeu.lamb.finanzas.dto.ReembolsoPagoRequest;
import pe.edu.upeu.lamb.finanzas.dto.ReembolsoPagoResponse;
import pe.edu.upeu.lamb.finanzas.entity.CuentaEstudiante;
import pe.edu.upeu.lamb.finanzas.repository.PagoRepository;
import pe.edu.upeu.lamb.finanzas.exception.BusinessRuleException;
import pe.edu.upeu.lamb.finanzas.entity.Pago;
import pe.edu.upeu.lamb.finanzas.entity.EstadoSolicitudDevolucion;
import pe.edu.upeu.lamb.finanzas.entity.EstadoPago;
import pe.edu.upeu.lamb.finanzas.entity.ReembolsoPago;
import pe.edu.upeu.lamb.finanzas.entity.SolicitudDevolucion;
import pe.edu.upeu.lamb.finanzas.exception.ResourceNotFoundException;
import pe.edu.upeu.lamb.finanzas.mapper.ReembolsoPagoMapper;
import pe.edu.upeu.lamb.finanzas.repository.CuentaEstudianteRepository;
import pe.edu.upeu.lamb.finanzas.repository.ReembolsoPagoRepository;
import pe.edu.upeu.lamb.finanzas.repository.SolicitudDevolucionRepository;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReembolsoPagoService {

    private final ReembolsoPagoRepository reembolsoPagoRepository;
    private final SolicitudDevolucionRepository solicitudDevolucionRepository;
    private final CuentaEstudianteRepository cuentaEstudianteRepository;
    private final PagoRepository pagoRepository;
    private final ReembolsoPagoMapper reembolsoPagoMapper;

    public List<ReembolsoPagoResponse> listar() {
        return reembolsoPagoRepository.findAll().stream()
                .map(reembolsoPagoMapper::toResponse)
                .toList();
    }

    public ReembolsoPagoResponse obtener(Long id) {
        return reembolsoPagoMapper.toResponse(buscarOFallar(id));
    }

    @Transactional
    public ReembolsoPagoResponse crear(ReembolsoPagoRequest request) {
        SolicitudDevolucion solicitudDevolucion = solicitudDevolucionRepository.findById(request.getIdSolicitudDevolucion())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No se encontro la solicitud de devolucion con id " + request.getIdSolicitudDevolucion()));
        CuentaEstudiante cuentaEstudiante = cuentaEstudianteRepository.findById(request.getIdCuentaEstudiante())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No se encontro la cuenta de estudiante con id " + request.getIdCuentaEstudiante()));
        if (solicitudDevolucion.getEstado() != EstadoSolicitudDevolucion.APROBADA) {
            throw new BusinessRuleException("Solo se reembolsa una solicitud APROBADA; la solicitud "
                    + solicitudDevolucion.getId() + " esta " + solicitudDevolucion.getEstado());
        }
        if (reembolsoPagoRepository.existsBySolicitudDevolucionId(solicitudDevolucion.getId())) {
            throw new BusinessRuleException("La solicitud " + solicitudDevolucion.getId() + " ya tiene un reembolso");
        }
        Pago pago = solicitudDevolucion.getPago();
        if (pago.getEstado() != EstadoPago.APROBADO) {
            throw new BusinessRuleException("El pago " + pago.getId() + " esta " + pago.getEstado()
                    + ": solo se reembolsa un pago APROBADO");
        }
        validarReembolso(solicitudDevolucion, cuentaEstudiante, request);

        // El pago queda REEMBOLSADO. El saldo de la cuenta no cambia: ese cargo ya estaba pagado.
        pago.setEstado(EstadoPago.REEMBOLSADO);
        pagoRepository.save(pago);

        ReembolsoPago entity = ReembolsoPago.builder()
                .solicitudDevolucion(solicitudDevolucion)
                .cuentaEstudiante(cuentaEstudiante)
                .montoReembolsado(request.getMontoReembolsado())
                .fecha(request.getFecha())
                .build();

        return reembolsoPagoMapper.toResponse(reembolsoPagoRepository.save(entity));
    }

    @Transactional
    public ReembolsoPagoResponse actualizar(Long id, ReembolsoPagoRequest request) {
        ReembolsoPago entity = buscarOFallar(id);
        if (!entity.getSolicitudDevolucion().getId().equals(request.getIdSolicitudDevolucion())) {
            throw new BusinessRuleException("No se puede cambiar la solicitud de un reembolso: eliminelo y registre otro");
        }
        CuentaEstudiante cuentaEstudiante = cuentaEstudianteRepository.findById(request.getIdCuentaEstudiante())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No se encontro la cuenta de estudiante con id " + request.getIdCuentaEstudiante()));
        validarReembolso(entity.getSolicitudDevolucion(), cuentaEstudiante, request);
        entity.setCuentaEstudiante(cuentaEstudiante);
        entity.setMontoReembolsado(request.getMontoReembolsado());
        entity.setFecha(request.getFecha());
        return reembolsoPagoMapper.toResponse(reembolsoPagoRepository.save(entity));
    }

    // Si otro registro lo usa (FK), la base lo impide y el manejador global responde 409
    @Transactional
    public void eliminar(Long id) {
        ReembolsoPago entity = buscarOFallar(id);
        // Sin reembolso el pago vuelve a estar cobrado
        Pago pago = entity.getSolicitudDevolucion().getPago();
        if (pago.getEstado() == EstadoPago.REEMBOLSADO) {
            pago.setEstado(EstadoPago.APROBADO);
            pagoRepository.save(pago);
        }
        reembolsoPagoRepository.delete(entity);
        reembolsoPagoRepository.flush();
    }

    /** Monto entre 0 y lo solicitado, y a la cuenta de la misma persona que pago. */
    private void validarReembolso(SolicitudDevolucion solicitud, CuentaEstudiante cuenta, ReembolsoPagoRequest request) {
        if (request.getMontoReembolsado().signum() <= 0) {
            throw new BusinessRuleException("El monto reembolsado debe ser mayor a 0");
        }
        if (request.getMontoReembolsado().compareTo(solicitud.getMontoSolicitado()) > 0) {
            throw new BusinessRuleException("El monto reembolsado (S/ " + request.getMontoReembolsado()
                    + ") supera lo solicitado (S/ " + solicitud.getMontoSolicitado() + ")");
        }
        if (!cuenta.getIdPersona().equals(solicitud.getPago().getIdPersona())) {
            throw new BusinessRuleException("La cuenta " + cuenta.getId() + " no es de la persona que hizo el pago "
                    + solicitud.getPago().getId());
        }
    }

    private ReembolsoPago buscarOFallar(Long id) {
        return reembolsoPagoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro el reembolso de pago con id " + id));
    }
}
