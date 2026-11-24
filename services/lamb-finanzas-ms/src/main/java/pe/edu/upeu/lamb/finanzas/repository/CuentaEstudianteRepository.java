package pe.edu.upeu.lamb.finanzas.repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import pe.edu.upeu.lamb.finanzas.entity.CuentaEstudiante;

import java.util.Optional;

public interface CuentaEstudianteRepository extends JpaRepository<CuentaEstudiante, Long> {

    Optional<CuentaEstudiante> findByIdPersona(Long idPersona);

    // Bloquea la fila mientras se actualiza el saldo: dos movimientos a la vez no se pisan.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from CuentaEstudiante c where c.id = :id")
    Optional<CuentaEstudiante> findByIdParaActualizar(Long id);
}
