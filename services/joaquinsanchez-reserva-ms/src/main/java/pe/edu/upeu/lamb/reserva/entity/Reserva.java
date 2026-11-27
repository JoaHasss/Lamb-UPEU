package pe.edu.upeu.lamb.reserva.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/*
 * ============================================================================================
 * PASO 10 de 15: entity/<Recurso>.java  (una FILA de la tabla creada por Flyway en el PASO 4)
 * ============================================================================================
 * CAMBIAR:
 *   - Nombre: <Recurso>   ej. Notificacion -> Reserva
 *   - @Table(name = "<recursos>")  -> el MISMO nombre de tabla del CREATE TABLE del PASO 4
 *   - Un campo por cada columna del SQL, con el mismo largo (length) y nullable.
 *     Columna con guion bajo -> @Column(name = "creado_en") private LocalDateTime creadoEn;
 *   - Si el examen usa otro id de negocio en vez de "referencia", cambialo aqui, en el
 *     repository (PASO 11) y en el consumer (PASO 15).
 *
 * OJO:
 *   - ddl-auto: validate compara esta clase con la tabla al arrancar. Si algo no coincide el
 *     servicio NO arranca: "Schema-validation: missing column [...]" o "wrong column type".
 *     Arregla la ENTITY, no el SQL (un SQL ya ejecutado no se edita, ver GUIA-EXAMEN.md).
 *   - @Getter/@Setter y no @Data: @Data genera equals/hashCode con todos los campos y da
 *     problemas en entidades JPA.
 *   - @Enumerated(EnumType.STRING) guarda "ENVIADA" (texto) y no 1 (numero).
 *
 * Verificar: reinicia el servicio; si arranca, la entity coincide con la tabla.
 *
 * SIGUIENTE: repository/<Recurso>Repository.java (PASO 11)
 */
@Entity
@Table(name = "reservas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reserva {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 40)
    private String referencia;

    @Column(nullable = false, length = 120)
    private String destinatario;

    @Column(nullable = false, length = 20)
    private String canal;

    @Column(nullable = false, length = 255)
    private String mensaje;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoReserva estado;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false, updatable = false)
    private LocalDateTime creadoEn;
}
