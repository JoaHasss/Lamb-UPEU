package pe.edu.upeu.lamb.notificacion.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.upeu.lamb.notificacion.entity.Notificacion;

/*
 * ============================================================================================
 * PASO 11 de 15: repository/<Recurso>Repository.java
 * ============================================================================================
 * CAMBIAR:
 *   - Nombre: <Recurso>Repository y el generico JpaRepository<<Recurso>, Long>
 *     ej. NotificacionRepository extends JpaRepository<Notificacion, Long>
 *      -> ReservaRepository extends JpaRepository<Reserva, Long>
 *   - existsBy<CampoUnico>: el campo que tiene UNIQUE en el SQL (el que usa la idempotencia).
 *     ej. existsByReferencia(String referencia) -> existsByCodigo(String codigo)
 *     El nombre del metodo debe coincidir con el nombre del campo de la entity (Spring arma el SQL).
 *
 * SIGUIENTE: dto/<Recurso>Request.java (PASO 12)
 */
public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {

    boolean existsByReferencia(String referencia);
}
