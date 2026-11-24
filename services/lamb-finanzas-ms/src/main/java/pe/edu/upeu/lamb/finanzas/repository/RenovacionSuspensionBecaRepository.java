package pe.edu.upeu.lamb.finanzas.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.upeu.lamb.finanzas.entity.RenovacionSuspensionBeca;

import java.time.LocalDate;
import java.util.Optional;

public interface RenovacionSuspensionBecaRepository extends JpaRepository<RenovacionSuspensionBeca, Long> {

    // Ultimo movimiento (renovacion o suspension) de la beca hasta la fecha dada.
    Optional<RenovacionSuspensionBeca> findFirstByBecaAplicadaIdAndFechaLessThanEqualOrderByFechaDescIdDesc(
            Long idBecaAplicada, LocalDate fecha);
}
