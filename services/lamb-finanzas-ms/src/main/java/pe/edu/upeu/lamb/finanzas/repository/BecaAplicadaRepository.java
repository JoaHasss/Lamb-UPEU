package pe.edu.upeu.lamb.finanzas.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.upeu.lamb.finanzas.entity.BecaAplicada;

import java.time.LocalDate;
import java.util.List;

public interface BecaAplicadaRepository extends JpaRepository<BecaAplicada, Long> {

    List<BecaAplicada> findByIdPersonaAndFechaInicioLessThanEqual(Long idPersona, LocalDate fecha);
}
