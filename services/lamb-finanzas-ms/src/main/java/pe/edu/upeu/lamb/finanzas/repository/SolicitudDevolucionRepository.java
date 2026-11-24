package pe.edu.upeu.lamb.finanzas.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.upeu.lamb.finanzas.entity.SolicitudDevolucion;
import pe.edu.upeu.lamb.finanzas.entity.EstadoSolicitudDevolucion;

public interface SolicitudDevolucionRepository extends JpaRepository<SolicitudDevolucion, Long> {

    boolean existsByPagoIdAndEstadoIn(Long idPago, java.util.Collection<EstadoSolicitudDevolucion> estados);
}
