package pe.edu.upeu.lamb.finanzas.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.upeu.lamb.finanzas.entity.DescuentoAplicado;

import java.time.LocalDate;
import java.util.List;

public interface DescuentoAplicadoRepository extends JpaRepository<DescuentoAplicado, Long> {

    List<DescuentoAplicado> findByIdPersonaAndFechaInicioLessThanEqual(Long idPersona, LocalDate fecha);
}
