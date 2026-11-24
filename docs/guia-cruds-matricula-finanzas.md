# Guía de estudio: los CRUD de `matricula-ms` y `finanzas-ms`

Esta guía va **de lo más simple a lo más complejo**. Primero, la estructura que repiten todos los CRUD. Después, en qué orden se crean los datos. Al final, los casos con reglas de negocio, otros microservicios y eventos.

> Consejo: abre los archivos citados mientras lees. Casi todo el código sigue el mismo molde, así que entender un CRUD simple es entender la mitad del proyecto.

---

## 1. El molde: las 6 capas de un CRUD

Todos los CRUD de ambos servicios tienen las mismas piezas. Ejemplo con **Tipo de beca** (`finanzas-ms`):

```
Petición HTTP
   │
   ▼
Controller   DescuentosBecasController     recibe la petición, valida el JSON (@Valid), llama al service
   │
   ▼
Service      TipoBecaService               reglas de negocio y transacciones (@Transactional)
   │
   ├──► Mapper      TipoBecaMapper         convierte Request → Entity y Entity → Response
   │
   ▼
Repository   TipoBecaRepository            acceso a la base (Spring Data JPA, sin SQL escrito)
   │
   ▼
Entity       TipoBeca                      la tabla tipos_beca como clase Java (@Entity)
```

Y los **DTO** (`TipoBecaRequest` / `TipoBecaResponse`): lo que entra y lo que sale por la API.

| Capa | Responsabilidad | Qué NO hace |
|---|---|---|
| Controller | Mapear URL y método HTTP, validar formato | No tiene reglas de negocio |
| Service | Reglas, transacciones, buscar o fallar | No sabe de HTTP |
| Mapper | Copiar campos entre DTO y entidad | No accede a la base |
| Repository | Guardar, buscar, borrar | No decide nada |
| Entity | Representar la tabla | No se devuelve directamente al cliente |
| DTO | Contrato de la API | No es la tabla |

**¿Por qué separar Entity y DTO?** Para no exponer la base tal cual: la API puede cambiar sin cambiar la tabla y al revés. Por ejemplo, `ConceptoPago` tiene un objeto `categoria`, pero la API solo recibe y devuelve `idCategoria`.

### Las 5 operaciones y su código HTTP

| Operación | HTTP | Ruta (ejemplo) | Respuesta |
|---|---|---|---|
| Listar | `GET` | `/api/v1/descuentos-becas/tipos-beca` | 200 + lista |
| Obtener | `GET` | `.../tipos-beca/{id}` | 200, o 404 si no existe |
| Crear | `POST` | `.../tipos-beca` | **201 Created** |
| Editar | `PUT` | `.../tipos-beca/{id}` | 200 |
| Eliminar | `DELETE` | `.../tipos-beca/{id}` | **204 No Content** |

### Los errores salen siempre igual

Cada servicio tiene un `GlobalExceptionHandler` (`@RestControllerAdvice`) que convierte excepciones en respuestas JSON:

| Excepción | HTTP | Cuándo |
|---|---|---|
| `MethodArgumentNotValidException` | **400** | El JSON no cumple `@NotNull`, `@NotBlank`, `@Size`... |
| `ResourceNotFoundException` | **404** | `buscarOFallar(id)` no encuentra el registro |
| `BusinessRuleException` | **409** | Se rompe una regla de negocio ("no se puede aceptar un pago PENDIENTE") |
| `DataIntegrityViolationException` | **409** | La base lo impide: clave foránea o valor único duplicado |

Así el service no se llena de `try/catch`: lanza la excepción y el manejador responde.

---

## 2. Orden para crear la información

Un registro no se puede crear si el registro que necesita aún no existe. Este es el orden, de arriba hacia abajo. (Al **eliminar**, el orden es el inverso: primero lo de abajo.)

> Al clonar el proyecto no hace falta crear nada a mano: los seeds de `db/seed-dev` cargan todo esto en orden. Esta sección sirve para entender las dependencias y para crear datos nuevos.

### 2.1 Fuera de estos dos servicios (se necesitan antes)

```
personas-ms ── Persona (estudiantes)
planificacion-ms ── Tipo de periodo → Periodo académico → Curso → Oferta académica → Grupo (ABIERTO)
```

- **Persona:** casi todo en matrícula y finanzas pertenece a una persona (`idPersona`).
- **Grupo:** lo que el estudiante elige al matricularse. Depende de un periodo y de un curso (vía la oferta).
- *Tipo de periodo* y *Periodo académico* aparecen en el menú de Matrícula, pero sus datos viven en `planificacion-ms`.

### 2.2 `matricula-ms`

```
                     ┌─► Variación de matrícula
Cronograma ──────────┤
                     └─► Ampliación de plazo

Tipo de matrícula ─────┐
Modalidad de matrícula ┼─► Matrícula ──(evento)──► cargo PENDIENTE en finanzas
Persona + Grupo(s) ────┘
```

| Orden | Apartado | Necesita antes | Notas |
|---|---|---|---|
| 1 | **Tipo de matrícula** | — | Catálogo. Ya viene cargado (MAT-001..010, migración V9). |
| 1 | **Modalidad de matrícula** | — | Catálogo. Ya viene cargado (Presencial, Semipresencial, A distancia). |
| 2 | **Cronograma de matrícula** | — | Periodo (texto, p. ej. `2026-2`) y fechas de matrícula. |
| 3 | **Variación de matrícula** | Cronograma | Rectificación o retiro dentro de ese cronograma. |
| 3 | **Ampliación de plazo** | Cronograma | Extiende la fecha del cronograma. |
| 4 | **Matrícula** | Persona, Tipo, Modalidad, Grupo(s) | Al guardarla, `finanzas-ms` crea su cargo `PENDIENTE` (sección 5). |

Al eliminar: un **cronograma** con variaciones o ampliaciones no se puede borrar (409); primero se borran esas.

### 2.3 `finanzas-ms`

```
Categoría de concepto ─► Concepto de pago

Persona ─► Cuenta de estudiante ─────────────────────────────┐
Persona ─► Pago (Nuevo pago)  o  Matrícula ─► cargo PENDIENTE │
                     │                                        │
                     ▼ (cuando está APROBADO)                 │
              Solicitud de devolución ──(APROBADA)──► Reembolso
Tipo de beca ─► Beca aplicada (a una Persona)
```

| Orden | Apartado | Necesita antes | Notas |
|---|---|---|---|
| 1 | **Categoría de concepto** | — | No está en el menú; viene en el seed (Académico, Trámites). |
| 2 | **Concepto de pago** | Categoría | El tarifario: Matrícula S/ 350, Constancia S/ 30... |
| 1 | **Tipo de beca** | — | Excelencia, Socioeconómica, Deportiva... |
| 2 | **Beca aplicada** | Persona, Tipo de beca | Porcentaje y fecha desde la que rige. |
| 2 | **Cuenta de estudiante** | Persona | **Una sola por persona** (si ya tiene, 409). |
| 2 | **Pago** | Persona | Con *Nuevo pago*, o automático al registrar una matrícula. |
| 3 | **Solicitud de devolución** | Pago (cobrado) | Estados: Pendiente, Aprobada, Rechazada. |
| 4 | **Reembolso** | Solicitud de devolución, Cuenta de estudiante | La devolución efectiva del dinero. |

Al eliminar, la base protege las relaciones con claves foráneas: no se borra un *tipo de beca* asignado, una *solicitud* con reembolso ni una *cuenta* con reembolsos (409).

### 2.4 El recorrido en el frontend, pantalla por pantalla

Abre `http://localhost:4200` y entra al módulo desde la portada o desde el menú de módulos. En cada apartado, **"Nuevo"** abre el formulario, **"Editar"** lo modifica y **"Eliminar"** pide confirmación. Los campos que dependen de otro registro son **desplegables** con lo que ya existe; por eso hay que respetar el orden.

#### Módulo Matrícula (`/matriculas`)

| Paso | Menú lateral | Botón | Qué llenar | Desplegables que usa |
|---|---|---|---|---|
| 1 | Tipo de matrícula | Nuevo | Código, nombre, descripción, artículo legal, créditos mínimos, días hábiles, máx. veces desaprobado, ¿requiere pago?, ¿activo? | — |
| 2 | Modalidad de matrícula | Nuevo | Código, nombre, descripción, artículo legal, créditos mínimos... | Modalidad de estudio |
| 3 | Cronograma de matrícula | Nuevo | Periodo (`2026-2`), fecha inicio, fecha fin, descripción | — |
| 4 | Variación de matrícula | Nuevo | Tipo (Rectificación, Retiro...), fechas, descripción | **Cronograma** (del paso 3) |
| 5 | Ampliación de plazo de matrícula | Nuevo | Fecha ampliada, motivo, autorizado por | **Cronograma** (del paso 3) |
| 6 | Matrículas | **Nueva matrícula** | Ver abajo | **Estudiante, Tipo, Modalidad, Grupo** |

**Paso 6 en detalle (Nueva matrícula):**

1. **Estudiante:** elige a la persona (viene de `personas-ms`).
2. **Tipo de matrícula** y **Modalidad de matrícula:** vienen de los pasos 1 y 2.
3. **Agregar curso** → en **Grupo** elige un grupo abierto (viene de `planificacion-ms`). Al elegirlo se completan solos el **Periodo** y los **Créditos**. Repite "Agregar curso" por cada curso; "Quitar" elimina una fila.
4. **Guardar.** La matrícula queda `REGISTRADA`.
5. Ve a **Finanzas → Pagos**: aparece un cargo `PENDIENTE` de S/ 350 con origen "Matrícula N". Lo creó `finanzas-ms` solo, al recibir el evento de Kafka.

En la lista de matrículas, **Confirmar** y **Anular** cambian el estado a mano; normalmente la confirmación llega sola cuando se aprueba el pago.

> *Periodo académico* y *Tipo de periodo* también están en el menú de Matrícula, pero sus datos son de `planificacion-ms`. Ya vienen cargados; solo hay que tocarlos para abrir un periodo nuevo.

#### Módulo Finanzas (`/pagos`)

| Paso | Menú lateral | Botón | Qué llenar | Desplegables que usa |
|---|---|---|---|---|
| 1 | *(sin menú: `/categorias-concepto`)* | Nuevo | Nombre de la categoría | — |
| 2 | Conceptos de pago | Nuevo | Nombre, monto, vigente desde/hasta | **Categoría** |
| 3 | Becas | Nuevo | Nombre, descripción del tipo de beca | — |
| 4 | Becas aplicadas | Nuevo | Porcentaje, rige desde | **Persona, Tipo de beca** (paso 3) |
| 5 | Cuentas de estudiante | Nuevo | Saldo actual (lo que adeuda) | **Persona** (una cuenta por persona) |
| 6 | Pagos | **Nuevo pago** | Concepto, monto → **Procesar pago** (va a Mercado Pago) | **Persona** |
| 7 | Pagos | **Pagar** / **Aceptar** / **Rechazar** | Cobrar el cargo o validarlo a mano | — |
| 8 | Solicitudes de devolución | Nuevo | Motivo, monto (se propone el del pago), estado, fecha | **Pago** — solo pagos **APROBADOS** |
| 9 | Reembolsos | Nuevo | Monto (se propone el solicitado), fecha | **Solicitud de devolución** (paso 8), **Cuenta** (paso 5, se propone sola) |

**El flujo completo de una matrícula pagada, de punta a punta:**

1. *Matrícula → Matrículas → Nueva matrícula* → Guardar → queda `REGISTRADA`.
2. *Finanzas → Pagos* → aparece su cargo `PENDIENTE`.
3. **Pagar** → Mercado Pago → tarjeta de prueba con titular `APRO` → "Volver al sitio" → el pago queda `APROBADO`.
   *(Sin credenciales de Mercado Pago, **Pagar** muestra un error y el cargo sigue `PENDIENTE`: el cambio a `EN PROCESO` solo ocurre si Mercado Pago creó el cobro. **Aceptar** solo aparece en pagos `EN PROCESO`.)*
4. *Matrícula → Matrículas* → la matrícula ya está `CONFIRMADA` (llegó el evento `pago.aceptado`).
5. Si hay que devolver el dinero: *Solicitudes de devolución → Nuevo* (elige ese pago) → estado `APROBADA` → *Reembolsos → Nuevo*.

**Botón "Ver detalles"** en Pagos: muestra el voucher (si lo hay) y, si el pago viene de una matrícula, su periodo, estado y cursos.

---

## 3. Nivel 1 — CRUD de catálogo (lo más simple)

**Ejemplos:** Tipo de beca, Tipo de matrícula, Modalidad de matrícula, Cronograma.

Solo guardan datos propios, sin relaciones. El service casi no tiene lógica:

```java
public TipoBecaResponse crear(TipoBecaRequest request) {
    TipoBeca entity = tipoBecaMapper.toEntity(request);      // DTO → entidad
    return tipoBecaMapper.toResponse(tipoBecaRepository.save(entity)); // guardar → DTO
}

@Transactional
public TipoBecaResponse actualizar(Long id, TipoBecaRequest request) {
    TipoBeca entity = buscarOFallar(id);   // 404 si no existe
    entity.setNombre(request.getNombre());
    entity.setDescripcion(request.getDescripcion());
    return tipoBecaMapper.toResponse(tipoBecaRepository.save(entity));
}

private TipoBeca buscarOFallar(Long id) {
    return tipoBecaRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Tipo de beca no encontrado: " + id));
}
```

Ideas a dominar:

- **`buscarOFallar`**: patrón repetido en todos los services. Centraliza el 404.
- **`@Transactional`**: si algo falla a mitad de camino, se deshace todo.
- **Validación en el DTO**: `@NotBlank String nombre` hace que un nombre vacío dé 400 sin escribir un `if`.
- **Ruta agrupada**: varios catálogos comparten controlador. Por ejemplo `CalendarioPeriodosController` atiende `/calendario-periodos/cronogramas`, `/variaciones`, `/tipos`, `/modalidades` y `/ampliaciones-plazo`.

---

## 4. Nivel 2 — CRUD con relación

### 4.1 Relación dentro del mismo servicio (con clave foránea)

**Ejemplos:** Concepto de pago → Categoría; Beca aplicada → Tipo de beca; Reembolso → Solicitud y Cuenta.

El Request trae un **id** (`idCategoria`); el service busca la entidad y la asocia:

```java
CategoriaConcepto categoria = categoriaConceptoRepository.findById(request.getIdCategoria())
        .orElseThrow(() -> new ResourceNotFoundException("Categoria de concepto no encontrada: " + ...));
ConceptoPago entity = ConceptoPago.builder()
        .categoria(categoria)          // @ManyToOne en la entidad
        .nombre(request.getNombre())
        ...
```

- Si el id no existe → **404** (antes de tocar la base).
- La entidad usa `@ManyToOne` + `@JoinColumn`; en la tabla hay una **clave foránea** real. Por eso la base impide borrar una categoría que tiene conceptos (**409**).
- En el frontend, el id se elige con un **desplegable** que carga los registros existentes, no se escribe a mano.

### 4.2 Relación con otro microservicio (solo el id, sin clave foránea)

**Ejemplos:** `idPersona` en Matrícula, Pago, Cuenta y Beca aplicada; `idSeccion` (grupo) en el detalle de matrícula.

Cada microservicio tiene **su propia base de datos** ("base de datos por servicio"). Una base no puede tener clave foránea hacia otra, así que se guarda solo el número.

- **Ventaja:** los servicios son independientes; si `personas-ms` cae, finanzas sigue funcionando.
- **Costo:** nadie garantiza que la persona exista. Se valida en la aplicación (ver Matrícula, nivel 4) o se acepta el riesgo.

### 4.3 Relación sin clave foránea dentro del mismo servicio

**Ejemplo:** Variación y Ampliación guardan `id_cronograma` sin clave foránea. Por eso `CronogramaMatriculaService.eliminar` lo valida a mano:

```java
if (variacionMatriculaRepository.existsByIdCronograma(id) || ampliacionPlazoMatriculaRepository.existsByIdCronograma(id)) {
    throw new BusinessRuleException("No se puede eliminar el cronograma " + id + ": tiene variaciones o ampliaciones...");
}
```

`existsByIdCronograma` es una **consulta derivada** de Spring Data: el nombre del método se convierte en SQL automáticamente.

---

## 5. Nivel 3 — CRUD con reglas de estado

### Pago (`PagoService`, `PasarelaPagoService`)

Un pago no se edita libremente: **cambia de estado** con acciones concretas.

```
PENDIENTE ──Pagar──► EN_PROCESO ──Aceptar / Mercado Pago approved──► APROBADO ──Reembolsar──► REEMBOLSADO
                          └──Rechazar / Mercado Pago rejected──► RECHAZADO
```

| Acción | Endpoint | Regla |
|---|---|---|
| Pagar | `POST /pagos/{id}/preferencia` | Solo `PENDIENTE` o `EN_PROCESO` |
| Aceptar / Rechazar | `POST /pagos/{id}/aceptar` · `/rechazar` | Solo `EN_PROCESO` |
| Reembolsar | `POST /pagos/{id}/reembolsar` | Solo `APROBADO` |

Si no se cumple → `BusinessRuleException` → **409**. Esto se llama **máquina de estados**: la regla vive en el service, no en el frontend, así nadie la salta llamando a la API directamente.

**¿Por qué Pagos no tiene Eliminar?** Es un registro contable: un pago no se borra, se rechaza o se reembolsa. Así queda el historial.

### Matrícula

```
REGISTRADA ──pago.aceptado──► CONFIRMADA
     └──────anular──────────► ANULADA
```

`confirmar()` es **idempotente**: si ya está `CONFIRMADA` (o `ANULADA`) no hace nada. Importa porque Kafka puede entregar el mismo evento dos veces.

---

## 6. Nivel 4 — CRUD que habla con otros servicios

### 6.1 Llamada síncrona con plan B: crear Matrícula

`MatriculaService.crear` pregunta a `planificacion-ms` si cada grupo está `ABIERTO`, usando **Feign** (`PlanificacionClient`): un cliente HTTP declarado como interfaz, que encuentra el servicio por su nombre en **Eureka**.

La llamada está protegida con un **Circuit Breaker** (Resilience4j, `@CircuitBreaker(name = "planificacion")`):

- Si planificación responde y el grupo no está abierto → **409**, no se matricula.
- Si planificación **no responde**, se ejecuta el `fallbackSeccion` → devuelve `null` → la matrícula **se registra igual** y la sección se valida después.
- Si falla muchas veces seguidas (50% de 5 llamadas, según el yml), el circuito "se abre" y deja de intentar por un tiempo: no se espera a un servicio caído en cada petición.

> **Detalle técnico a conocer:** `PlanificacionClient` llama a `GET /api/v1/secciones/{id}`, pero hoy `planificacion-ms` expone `/api/v1/grupos`. La llamada falla siempre y entra el fallback, así que en la práctica **no se valida** el estado del grupo. Es un pendiente para corregir.

> **Truco de Spring:** el método con `@CircuitBreaker` está en un bean aparte (`PlanificacionConsultaService`). Si estuviera dentro de `MatriculaService`, la llamada sería interna y el proxy de Spring no la interceptaría: el circuit breaker no funcionaría.

### 6.2 Comunicación asíncrona: la saga matrícula ↔ pago

```
matricula-ms                         Kafka                          finanzas-ms
crear() ──► matricula.registrada ──► topic matricula-eventos ──► genera cargo PENDIENTE (S/ 350)
                                                                       │
                                                         Pagar / Aceptar → APROBADO
                                                                       │
confirmar() ◄── topic pago-aceptado-eventos ◄── pago.aceptado ◄────────┘
```

- **Asíncrono:** matrícula no espera a finanzas. Si finanzas está caído, el evento queda en Kafka y se procesa al volver.
- **Publicar tras el commit** (`publicarTrasCommit`): el evento sale solo si la transacción en la base terminó bien.
- **Idempotencia del consumidor:** `generarCargoDeMatricula` revisa si ya existe un cargo para esa `matriculaId`; si el evento llega dos veces, no duplica el cobro.
- **Saga:** una operación de negocio repartida en varios servicios, sin una transacción única. Cada paso se confirma por su cuenta y se coordina con eventos.

### 6.3 Llamada a una API externa: Mercado Pago

Ver [guia-mercado-pago.md](guia-mercado-pago.md). Es el caso más complejo: credenciales, redirección del navegador, confirmación contra un servicio de terceros y traducción de sus estados a los nuestros.

---

## 7. Cómo llegan los datos de prueba (seeds)

- **Migraciones versionadas** (`db/migration/V1__...sql`): crean y modifican tablas. Corren **una sola vez** y en orden. Ej.: `V9__seed_tipos_matricula.sql` inserta los tipos de matrícula (catálogo que también usa producción).
- **Seeds de demo** (`db/seed-dev/R__demo_*.sql`): migraciones **repetibles** de Flyway. Corren cuando su contenido cambia. Solo los lee el perfil dev (`locations: classpath:db/migration,classpath:db/seed-dev`); producción no.
- Usan **ids fijos + `ON CONFLICT DO NOTHING`**: se pueden ejecutar varias veces sin duplicar, y los ids coinciden entre servicios (la matrícula 3 de `matricula-ms` es la `matricula_id` 3 de `finanzas-ms`).
- Al final hacen `setval(...)` para que el próximo registro creado desde la app no choque con un id del seed.

| Servicio | Seed |
|---|---|
| personas-ms | `R__demo_personas.sql` — 5 estudiantes |
| planificacion-ms | `R__demo_planificacion.sql` — periodos, cursos, ofertas, grupos |
| matricula-ms | `R__demo_matriculas.sql` — cronogramas, variaciones, ampliación, matrículas e historial |
| finanzas-ms | `R__demo_pagos.sql` — conceptos, pagos, cuentas, becas, solicitudes y reembolso |

---

## 8. Resumen para repasar

1. **Nivel 1:** Controller → Service → Mapper → Repository → Entity, con DTO de entrada y salida.
2. **Errores:** 400 validación, 404 no existe, 409 regla de negocio o integridad.
3. **Nivel 2:** relaciones por id; con clave foránea dentro del servicio, sin ella entre servicios.
4. **Nivel 3:** máquinas de estado (Pago, Matrícula); los registros contables no se borran.
5. **Nivel 4:** Feign + Eureka + Circuit Breaker (síncrono) y Kafka + saga (asíncrono), con publicación tras commit e idempotencia.
6. **Orden de datos:** catálogos y personas primero, luego lo que los usa; al borrar, al revés.
