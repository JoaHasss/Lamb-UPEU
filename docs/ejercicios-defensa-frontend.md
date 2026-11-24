# Ejercicios para la defensa del frontend

Guía para explicarle al ingeniero tu flujo de trabajo y prepararte para sus preguntas: desde "cambia el texto de este botón" hasta explicar la lógica de becas, reembolsos, cuentas de estudiante y cómo una matrícula llega a finanzas.

Cómo usarla:
1. Lee la **Parte 1** (el mapa) hasta poder dibujarlo de memoria.
2. Haz los **retos de la Parte 3** en tu PC, con el frontend levantado (`npm start`).
3. Ensaya en voz alta las **explicaciones de la Parte 4 y 5** sin mirar la respuesta modelo.
4. Repasa las **preguntas trampa de la Parte 6**.

> Las referencias `archivo:línea` son del código al momento de escribir esta guía. Si editas esos archivos, las líneas se corren unas posiciones: busca el texto.

---

## Parte 1. El mapa: cómo está armado el frontend

### Piezas y carpetas (`clients/lamb-frontend/src/app/`)

| Carpeta | Qué contiene |
|---|---|
| `features/` | Una carpeta por pantalla o módulo (95 en total): `pagos/`, `matriculas/`, `becas-aplicadas/`, `cuentas/`, etc. |
| `core/` | Lo compartido: login, interceptores HTTP, guards de rol, `mensajeError`, pipes. |
| `layout/` | `shell.component.*`: el marco de la app (menú lateral y contenido). |
| `app.routes.ts` | Qué URL abre qué componente. |

### Cada módulo sigue el mismo molde de 4 archivos

```
features/pagos/
├── pago.model.ts       → tipos TypeScript (PagoRequest, PagoResponse...) = el "contrato" con el backend
├── pago-service.ts     → llamadas HTTP (listar, crear, aceptar...) al Gateway
├── pago-list.ts / .html → pantalla de la tabla
└── pago-form.ts / .html → pantalla del formulario
```

- **`.html`**: lo que ve el usuario (textos, botones, tabla).
- **`.ts`**: la lógica (qué pasa al hacer clic, qué se carga, validaciones).
- **`service`**: solo habla con el backend; no tiene pantalla.
- **`model`**: describe la forma de los datos.

### El camino de una petición

```
Pantalla (pago-list.ts)
   │  this.service.listar()
   ▼
PagoService  ──HTTP──►  authInterceptor (agrega "Authorization: Bearer <token>")
                              │
                              ▼
                  Gateway :18080  ──►  lamb-finanzas-ms  ──►  PostgreSQL
```

- La URL base sale de `environment.apiBaseUrl` (`http://localhost:18080`, el **Gateway**).
- El **token** lo da Keycloak al iniciar sesión (`core/auth/`). El `authInterceptor` lo añade a cada petición y lo renueva si está por vencer (dura 5 minutos).
- Si algo falla, `mensajeError()` convierte el error HTTP en un texto entendible.

### Conceptos de Angular que aparecen en el código

| Concepto | Qué es | Ejemplo |
|---|---|---|
| **signal** | Una variable "reactiva": cuando cambia, la pantalla se actualiza sola. | `protected readonly pagos = signal<PagoResponse[]>([])` y se cambia con `.set(...)` |
| **inject()** | Pide a Angular una dependencia (un servicio). | `private readonly service = inject(PagoService)` |
| **Formulario reactivo** | Un formulario definido en TypeScript con sus validaciones. | `this.fb.nonNullable.group({...})` |
| **subscribe** | Las llamadas HTTP devuelven un "observable": nada ocurre hasta que te suscribes. | `.subscribe({ next: ..., error: ... })` |
| **`@if` / `@for`** | Condicionales y bucles en el `.html`. | `@if (auth.tieneRol('ADMIN'))` |
| **rutas lazy** | Cada pantalla se descarga solo cuando se visita. | `loadComponent: () => import(...)` |

### Roles

`auth.tieneRol('ADMIN', 'COORDINADOR')` devuelve `true` si el usuario tiene al menos uno de esos roles. Se usa en dos lugares:
- En el `.html`, para **mostrar u ocultar botones** (por ejemplo `pago-list.html:14`).
- En `rolGuard` (`core/auth/rol-guard.ts`), para **bloquear una ruta entera**.

> Ocultar un botón no es seguridad: el backend también valida el rol (por eso un 403 se traduce en `mensaje-error.ts`).

---

## Parte 2. Tu flujo de trabajo (guion de 2 minutos)

Puedes decirlo así:

1. "Levanto la infraestructura: base de datos, `lamb-config`, Eureka, el Gateway, Keycloak y los microservicios."
2. "Arranco el frontend con `npm start` y lo abro en `http://localhost:4200`."
3. "Inicio sesión con Keycloak; el token viaja en cada petición al Gateway."
4. "Para cambiar una pantalla, busco su carpeta en `features/`. El texto está en el `.html`; la lógica, en el `.ts`; las llamadas al backend, en el `service`."
5. "Angular recompila al guardar, y compruebo en el navegador. Antes de subir, verifico que compile con `ng build`."
6. "Subo con `git add`, `git commit` y `git push` a `main`."

Comandos útiles:

```powershell
cd C:\Practica\Lamb-UPEU\clients\lamb-frontend
npm start                                    # servidor de desarrollo, http://localhost:4200
npx ng build --configuration development     # comprueba que todo compila
```

---

## Parte 3. Nivel 1: cambios rápidos (retos de "cambia este texto")

El ingeniero te dirá algo como "cambia el texto de este botón". El método es siempre el mismo:

> **1)** Identifica la pantalla y su carpeta en `features/`. **2)** Abre el `.html`. **3)** Busca el texto (Ctrl+F). **4)** Cámbialo y guarda. **5)** Mira el navegador.

### Textos y dónde están

| Texto en pantalla | Archivo y línea |
|---|---|
| Título "Pagos" | `features/pagos/pago-list.html:1` |
| Botón "Nuevo pago" | `features/pagos/pago-list.html:15` |
| Botón "Pagar" | `features/pagos/pago-list.html:61` |
| Botones "Aceptar" y "Rechazar" | `features/pagos/pago-list.html:64` y `:65` |
| "Ver detalles" / "Ocultar" | `features/pagos/pago-list.html:55` |
| Título "Nuevo pago" | `features/pagos/pago-form.html:1` |
| Etiqueta "Monto (S/)" | `features/pagos/pago-form.html:33` |
| Botón "Procesar pago" y su texto de espera | `features/pagos/pago-form.html:38` |
| Enlace "Cancelar" | `features/pagos/pago-form.html:39` |
| Título "Matriculas" | `features/matriculas/matricula-list.html:1` |
| Botón "Nueva matricula" | `features/matriculas/matricula-list.html:15` |
| Botones "Confirmar", "Eliminar" y "Anular" | `features/matriculas/matricula-list.html:52`, `:54` y `:57` |
| Opción "Pagos" del menú lateral | `layout/shell.component.html:194` |
| Opción "Conceptos de pago" del menú | `layout/shell.component.html:198` |
| Etiqueta "Porcentaje (%)" de becas | `features/becas-aplicadas/becas-aplicadas-form.html:28` |
| Etiqueta "Rige desde" de becas | `features/becas-aplicadas/becas-aplicadas-form.html:32` |
| Mensajes de error por estado HTTP (sesión expirada, sin permiso...) | `core/http/mensaje-error.ts:11-20` |
| Explicación de cada estado de pago ("Cargo generado y aún sin pagar...") | `features/pagos/pago-list.ts:13-19` |

### Retos con la solución

**Reto 1: cambia el botón "Nuevo pago" por "Registrar pago".**
Solución: en `pago-list.html:15`, cambia el texto entre las etiquetas `<a>...</a>`. Solo es texto.

**Reto 2: cambia "Pagos" del menú lateral por "Cobros".**
Solución: `shell.component.html:194`, dentro de `<span class="nav-item__label">`. Ojo: cambia solo el texto del menú; el título de la página sigue siendo "Pagos" porque está en otro archivo (`pago-list.html:1`). Si te piden cambiar ambos, son dos archivos.

**Reto 3: haz que el botón "Nuevo pago" también lo vea el rol ESTUDIANTE.**
Solución: `pago-list.html:14`, cambia `auth.tieneRol('ADMIN', 'COORDINADOR')` por `auth.tieneRol('ADMIN', 'COORDINADOR', 'ESTUDIANTE')`. Comenta que el backend también debe permitirlo, o recibirá un 403.

**Reto 4: cambia el mensaje cuando no hay permiso (403).**
Solución: `mensaje-error.ts:16`, texto "Tu rol no tiene permiso para esta operacion." Es un solo lugar y afecta a **todas** las pantallas, porque todas usan `mensajeError`.

**Reto 5: el porcentaje máximo de una beca debe ser 80 y no 100.**
Solución: hay que cambiarlo en **dos sitios**:
- `becas-aplicadas-form.html:29`: `max="100"` → `max="80"` (el límite del campo en pantalla).
- `becas-aplicadas-form.ts:29`: `Validators.max(100)` → `Validators.max(80)` (la validación que bloquea el envío).

Responde también: "el backend no valida ese tope", así que alguien podría saltarse el límite llamando directo a la API. Verifícalo antes de afirmarlo.

**Reto 6: pide confirmación antes de rechazar un pago.**
Solución: en `pago-list.ts`, método `rechazar` (línea ~101), añade al principio:
```ts
if (!confirm(`Rechazar el pago ${pago.id}?`)) {
  return;
}
```
El patrón `confirm(...)` + `return` es el que tenía el botón de reembolso que se quitó.

**Reto 7: cambia el nombre de un estado, por ejemplo "EN_PROCESO", en el texto de ayuda.**
Solución: `pago-list.ts:15`. Ojo: **no cambies la clave `EN_PROCESO`**, solo el texto. La clave es el valor real que viene del backend; si la cambias, la ayuda deja de aparecer.

**Reto 8: oculta el botón "Eliminar" de las matrículas.**
Solución: borra o comenta `matricula-list.html:54`. Y explica la diferencia: ocultar un botón no quita la funcionalidad del backend.

---

## Parte 4. Nivel 2: explica esta función (fácil)

Para cada una: lee el código, explícalo con tus palabras y compara con la respuesta modelo.

### 4.1. `esVigente` (`pagos/pago-form.ts`, ~línea 60)

```ts
private esVigente(c: ConceptosPagoResponse): boolean {
  const hoy = new Date().toISOString().slice(0, 10);
  return c.vigenciaDesde <= hoy && (c.vigenciaHasta == null || c.vigenciaHasta >= hoy);
}
```

**Respuesta modelo:** "Decide si un concepto de pago se puede usar hoy. Saca la fecha de hoy en formato `AAAA-MM-DD`. Un concepto es vigente si ya empezó (`vigenciaDesde` es hoy o antes) y no ha vencido: o no tiene fecha de fin (`vigenciaHasta` es `null`) o la fecha de fin es hoy o después. Como el formato es `AAAA-MM-DD`, comparar los textos funciona igual que comparar fechas."

**Pregunta de seguimiento:** "¿Por qué usas `slice(0, 10)`?" → `toISOString()` devuelve `2026-11-24T19:11:18.424Z`; `slice(0, 10)` se queda solo con la fecha.

### 4.2. Autocompletar el monto al elegir concepto (`pago-form.ts`, ~línea 51)

```ts
this.form.controls.idConcepto.valueChanges.subscribe((id) => {
  const concepto = this.conceptos().find((c) => c.id === Number(id));
  if (concepto?.monto != null) {
    this.form.controls.monto.setValue(concepto.monto);
  }
});
```

**Respuesta modelo:** "Cada vez que el usuario cambia el concepto del desplegable, esto se dispara. Busca ese concepto en la lista cargada y, si tiene monto, lo pone en el campo Monto. El usuario todavía puede editarlo. Uso `Number(id)` porque el valor del `<select>` puede llegar como texto."

### 4.3. `guardar()` del formulario de pago (`pago-form.ts`, ~línea 67)

**Respuesta modelo (en pasos):**
1. Si el formulario es inválido, marca todos los campos como tocados para que salgan los errores y se detiene.
2. Pone `enviando` en `true` para deshabilitar el botón y mostrar "Redirigiendo a Mercado Pago...".
3. Busca el concepto elegido; si no lo encuentra, muestra un error.
4. Llama a `procesar(...)`, que crea el pago en el backend en estado `EN_PROCESO`.
5. Con `switchMap` encadena una segunda llamada, `crearPreferencia(pago.id)`, usando el `id` del pago recién creado.
6. Si todo sale bien, redirige el navegador a `initPoint`, la página de pago de Mercado Pago. Si falla, muestra el error y reactiva el botón.

**Pregunta de seguimiento:** "¿Para qué sirve `switchMap`?" → Para hacer una llamada **después** de otra y usar su resultado; aquí necesito el `id` del pago antes de crear la preferencia.

### 4.4. `mensajeError` (`core/http/mensaje-error.ts`)

**Respuesta modelo:** "Recibe el error y un texto por defecto, y devuelve un mensaje para el usuario. Si no es un error HTTP, devuelve el texto por defecto. Si lo es, mira el código de estado: 0 significa que no hay conexión con el Gateway, 401 que la sesión expiró, 403 que su rol no tiene permiso, 503 que el microservicio no está disponible. Para el resto, intenta mostrar el motivo que mandó el backend, y si no hay, muestra el código HTTP. Está en `core` porque lo usan todas las pantallas."

### 4.5. `verDetalles` (`pagos/pago-list.ts:63`)

**Respuesta modelo:** "Abre o cierra el panel de detalles de un pago. Si ya estaba abierto el mismo, lo cierra. Si no, lo selecciona, limpia los datos anteriores, y si el pago viene de una matrícula, la pide a `lamb-matricula-ms` para mostrarla en el panel."

### 4.6. `rolGuard` (`core/auth/rol-guard.ts`)

**Respuesta modelo:** "Es un guard de ruta. Si el usuario tiene alguno de los roles requeridos, deja pasar. Si no, muestra una alerta y lo redirige al inicio. Sirve para proteger pantallas completas, no solo botones."

### 4.7. El `authInterceptor` (`core/auth/auth-interceptor.ts`)

**Respuesta modelo:** "Intercepta todas las peticiones HTTP. Antes de enviar, pide un token vigente (lo renueva si está por vencer) y lo agrega en la cabecera `Authorization: Bearer`. Si el backend responde 401, intenta renovar el token una vez y reenviar; si no se puede, manda al usuario a iniciar sesión otra vez."

---

## Parte 5. Nivel 3: lógica compleja (con respuesta modelo)

### 5.1. Becas y descuentos

**Dónde:** `lamb-finanzas-ms` → `service/CalculoDescuentoService.java`.
**Pantalla:** menú Finanzas → Becas aplicadas, con su formulario (`becas-aplicadas-form`: persona, tipo de beca, porcentaje 1-100, "Rige desde").

**Reglas** (están en el comentario de la clase):
1. Una beca está **vigente** si su fecha de inicio es hoy o antes **y** su último movimiento hasta esa fecha no es una `SUSPENSION`. Una `RENOVACION` posterior la reactiva (`estaSuspendida`, línea 71).
2. Si hay **varias becas** vigentes se toma la de **mayor porcentaje**: no se suman entre sí (línea 67). Lo mismo con los descuentos (línea 51).
3. **Beca + descuento sí se suman**, con **tope de 100 %** (línea 80: `.min(CIEN).max(ZERO)`).
4. Los montos se redondean a 2 decimales con `HALF_UP`.

**Ejemplos con los datos de demo** (cargo base de pensión S/ 500):

| Caso | Cálculo | Se cobra |
|---|---|---|
| Persona 1: beca 50 % + descuento 10 % | 60 % de 500 = 300 de descuento | **S/ 200** |
| Persona 2: sin beca, descuento 15 % | 75 de descuento | **S/ 425** |
| Persona 3 en octubre: beca deportiva 30 % **suspendida** | no cuenta, 0 % | **S/ 500** |
| Persona 3 en noviembre: beca **renovada** | 30 % = 150 de descuento | **S/ 350** |
| Persona 5: beca 25 % + convenio 80 % = 105 % | tope 100 % | **S/ 0** |

**Cómo se usa en la matrícula:** al generar el cargo de una matrícula (`PagoService.generarCargoDeMatricula`, línea 51) se llama a `calcular(...)`. El `Pago` guarda `monto` (lo que se cobra), `montoOriginal` y `montoDescuento`.

**Explicación modelo (30 segundos):** "Cuando se genera un cargo, finanzas busca la beca vigente del estudiante y el mejor descuento. Una beca no está vigente si su último movimiento hasta esa fecha es una suspensión; una renovación posterior la reactiva. Si hay varias becas se usa la mayor, no se suman. Luego suma beca más descuento, topa en 100 % y calcula el monto de descuento sobre el original. El pago guarda el monto original, el descuento y el monto final."

**Preguntas probables:**
- *"¿Qué pasa si una persona tiene dos becas, una de 50 % y otra de 30 %?"* → Se aplica solo la de 50 %, no 80 %.
- *"¿Y una beca de 50 % y un descuento de 20 %?"* → Se suman: 70 %.
- *"¿Y si suman 120 %?"* → Se limita a 100 %; el cargo queda en S/ 0.
- *"¿Una beca suspendida se pierde?"* → No: se reactiva con una renovación posterior; el cálculo mira el último movimiento hasta la fecha del cargo.
- *"¿Se recalculan los cargos ya generados si cambia la beca?"* → No. El cálculo se hace al generar el cargo y queda guardado en el pago.

### 5.2. Cuentas de estudiante (saldo a favor)

**Dónde:** `lamb-finanzas-ms` → `service/SaldoCuentaService.java`.
**Pantallas:** Finanzas → Cuentas (`features/cuentas/`), Movimientos y Ajustes manuales.

**Idea:** cada estudiante tiene una cuenta con un **saldo a favor**, como un monedero. Cada cambio deja un **movimiento** para poder explicar el saldo.

| Tipo de movimiento | Efecto | Línea |
|---|---|---|
| `ABONO` | **Suma** saldo a favor | `SaldoCuentaService.java:56` |
| `CARGO` | **Descuenta** saldo | `SaldoCuentaService.java:56` |

`saldo = suma(ABONO) − suma(CARGO)`. **Negativo significa que el estudiante debe** ese monto.

**Flujos:**
- **Crear la cuenta con un saldo inicial** (`CuentaEstudianteService.crear`): un monto positivo se guarda como `ABONO` ("Saldo inicial"). La cuenta siempre se crea en 0 y el saldo inicial es un movimiento más.
- **Pago aprobado** (`descontarPago`, línea 79): se registra un `CARGO` por el monto del pago. Si el saldo no alcanza, queda negativo.
- **Ajuste manual** (`AjusteManualSaldoService`): monto positivo suma saldo; negativo lo descuenta.
- **El saldo no se edita a mano** (`CuentaEstudianteService.actualizar`): solo cambia con movimientos.
- **Idempotencia:** `descontarPago` no descuenta dos veces el mismo pago (revisa si ya hay un `CARGO` de ese pago).

**Los datos de demo:** cada uno de los 5 estudiantes parte con un abono de S/ 1000 (movimientos 18 a 22 del seed `R__demo_pagos.sql`).

**Explicación modelo:** "La cuenta es un monedero. Los movimientos son el historial y el saldo es la suma de los abonos menos los cargos. Cuando un pago pasa a APROBADO, finanzas descuenta su monto del saldo con un cargo. Si el saldo no alcanza, queda negativo y se interpreta como deuda. El saldo nunca se edita a mano: siempre cambia a través de un movimiento, así el saldo siempre se puede explicar."

**Preguntas probables:**
- *"¿Cuándo se descuenta el saldo, al crear el pago o al aprobarlo?"* → Al **aprobarlo**. Un pago pendiente no toca el saldo.
- *"¿Por qué el saldo no se edita directamente?"* → Para que cada cambio deje rastro en los movimientos.
- *"¿Qué pasa con un reembolso?"* → El código actual **no devuelve el saldo** (ver 5.3).

### 5.3. Devoluciones y reembolsos

**Dónde:** `SolicitudDevolucionService` y `ReembolsoPagoService`.
**Pantallas:** Solicitudes de devolución y Reembolsos de pago.
El botón "Reembolsar" de la lista de Pagos **ya no existe**: se quitó. El flujo vive en esas dos pantallas.

```
Pago APROBADO ──► Solicitud de devolución ──► (aprobada) ──► Reembolso ──► Pago REEMBOLSADO
                  PENDIENTE / APROBADA / RECHAZADA
```

**Paso 1: Solicitud** (`SolicitudDevolucionService.crear`, línea 42). Reglas (`validarPagoDevolvible`, línea 92):
- Solo un pago **APROBADO** (un pendiente o rechazado no cobró nada).
- El monto debe ser mayor que 0 y **no mayor que lo pagado**.
- **Una sola solicitud viva por pago** (PENDIENTE o APROBADA, línea 47). Si se rechazó, se puede pedir de nuevo.
- En la pantalla (`solicitudes-devolucion-form.html`) solo aparecen los pagos aprobados en la lista.

**Paso 2: Reembolso** (`ReembolsoPagoService.crear`, línea 47). Reglas:
- La solicitud debe estar **APROBADA**.
- La solicitud no debe tener ya un reembolso.
- El pago debe seguir **APROBADO**.
- `validarReembolso` (línea 113): monto mayor que 0, **no mayor que lo solicitado**, y la cuenta debe ser de **la misma persona** que hizo el pago.
- Efecto (línea 69): el pago pasa a **REEMBOLSADO**.

**Eliminar un reembolso** (línea 100) deja el pago otra vez en **APROBADO**.

**Dato importante:** el reembolso **no cambia el saldo de la cuenta** (comentario de `ReembolsoPagoService.java:68`). Esa regla viene de cuando el saldo era "lo que se debe"; ahora que el saldo es a favor y un pago aprobado lo descuenta, ese comportamiento merece revisarse.

**Explicación modelo:** "Devolver dinero es un proceso de dos pasos con validaciones. Primero se crea una solicitud sobre un pago aprobado, por un monto que no supere lo pagado, y solo una solicitud viva por pago. Cuando se aprueba, se registra el reembolso: no puede exceder lo solicitado, debe ir a la cuenta de la misma persona y el pago pasa a REEMBOLSADO. Si se elimina el reembolso, el pago vuelve a APROBADO."

**Preguntas probables:**
- *"¿Se puede pedir devolución de un pago pendiente?"* → No, solo de uno aprobado.
- *"¿Y pedir más de lo que se pagó?"* → No; el backend lo rechaza con un mensaje.
- *"¿Se pueden hacer dos solicitudes sobre el mismo pago?"* → No mientras una esté pendiente o aprobada.
- *"¿Qué pasa si se borra un reembolso?"* → El pago vuelve a APROBADO.
- *"¿Por qué quitaron el botón Reembolsar de Pagos?"* → Porque se decidió que el reembolso se gestiona por su flujo de solicitud y reembolso, con validaciones.

### 5.4. De la matrícula a finanzas (la "saga")

La pregunta típica: **"cuando creo una matrícula, ¿cómo la jala finanzas?"**

**Respuesta corta:** finanzas **no la jala**. Matrícula **publica un evento** en Kafka y finanzas lo **escucha**. Los microservicios no se llaman directamente; se avisan por eventos.

```
 FRONTEND             lamb-matricula-ms              KAFKA                 lamb-finanzas-ms
 ────────             ─────────────────              ─────                 ────────────────
 "Nueva matricula" ─► crear()  [MatriculaService:60]
                      · valida secciones ABIERTAS
                      · guarda: estado REGISTRADA
                      · publica ───────►  matricula-eventos  ───────►  MatriculaEventosConsumer:19
                         [:78]  evento "matricula.registrada"           ► generarCargoDeMatricula [PagoService:51]
                                                                           · evita duplicados (existsByMatriculaId)
                                                                           · calcula beca y descuento
                                                                           · crea Pago PENDIENTE

 Lista de Pagos ──► "Pagar" ──► Mercado Pago ──► pago aprobado
                                                  · descontarPago (saldo a favor)
                                                  · publica "pago.aceptado"
                      PagoEventosConsumer:19  ◄──── pago-aceptado-eventos ◄─┘
                      confirmar() [MatriculaService:96]
                      · estado CONFIRMADA
```

**Pasos para explicarlo:**
1. Creas la matrícula en el frontend → `POST /api/v1/matriculas` → `MatriculaService.crear`.
2. Matrícula guarda la matrícula como **REGISTRADA** y publica el evento `matricula.registrada` (solo **después del commit**, para no avisar de algo que luego se revierta).
3. Finanzas, que está suscrita al topic `matricula-eventos`, recibe el evento y **crea un pago en estado PENDIENTE** con el monto, aplicando beca y descuento.
4. El pago aparece en la lista de Pagos con el origen "Matrícula N". El usuario pulsa **Pagar**.
5. Al aprobarse el pago, finanzas descuenta el saldo y publica `pago.aceptado`.
6. Matrícula escucha ese evento y **confirma** la matrícula (CONFIRMADA).

**Por qué así y no con una llamada HTTP directa:**
- Cada microservicio tiene **su propia base de datos**; no existe una transacción única que abarque las dos.
- Si finanzas estuviera caída, la matrícula se registra igual y el cargo se genera cuando finanzas vuelva a estar disponible.
- Los dos servicios quedan desacoplados.

**Protecciones:**
- **Idempotencia:** si Kafka reenvía el mismo evento, finanzas no duplica el cargo (`existsByMatriculaId`) y matrícula ignora la confirmación si ya está CONFIRMADA o ANULADA.
- **Publicar tras el commit** (`publicarTrasCommit`).

**Limitación honesta:** si el pago se **rechaza**, no se publica ningún evento y la matrícula queda REGISTRADA. Si Kafka falla al enviar, solo se registra el error en el log (no hay patrón *outbox*).

**Preguntas probables:**
- *"¿Cómo sabe finanzas que hay una matrícula nueva?"* → Por el evento `matricula.registrada` en Kafka.
- *"¿Qué pasa si finanzas está apagado al crear la matrícula?"* → La matrícula se guarda; el evento queda en Kafka y finanzas lo procesa al volver.
- *"¿Qué pasa si llega el mismo evento dos veces?"* → No se duplica el cargo (idempotencia).
- *"¿Quién confirma la matrícula?"* → El evento `pago.aceptado` que finanzas publica al aprobarse el pago.
- *"¿Por qué hay un botón 'Confirmar' en la lista de matrículas?"* → Permite confirmar a mano una matrícula REGISTRADA; `confirmar()` es idempotente.

### 5.5. Pago con Mercado Pago (resumen)

Detalle completo en [`integracion-mercadopago.md`](integracion-mercadopago.md). Para explicarlo en 30 segundos:

"En Nuevo pago el usuario elige persona, concepto y monto. El frontend crea el pago y luego una *preferencia* en Mercado Pago, y redirige al navegador a su página de pago. Ahí el usuario elige el método. Al terminar, Mercado Pago lo devuelve a `/pagos/resultado` con el id del pago; el frontend le pide al backend confirmarlo, el backend consulta a Mercado Pago el estado real y, si está aprobado, descuenta el saldo y publica el evento que confirma la matrícula."

---

## Parte 6. Preguntas trampa (para no caer)

1. **"Cambia el texto de este botón, pero no veo el cambio."**
   Comprueba: ¿editaste el archivo correcto? ¿Está `npm start` corriendo? ¿Recargaste el navegador (Ctrl+F5)? ¿El texto está en el `.html` o viene del backend? Algunos textos (los mensajes de error de negocio) los escribe el backend, no el frontend.

2. **"Quiero cambiar el estado 'APROBADO' a 'PAGADO'."**
   No es solo un texto: `APROBADO` es un **valor del backend** (enum `EstadoPago`) que se usa en la lógica, en el seed y en los `@if`. Cambiar solo lo que ve el usuario es fácil (un pipe o un mapa de etiquetas); cambiar el valor real afecta a todo el sistema.

3. **"¿Por qué el botón 'Aceptar' no aparece para un pago aprobado?"**
   Solo aparece con `pago.estado === 'EN_PROCESO'` (`pago-list.html:63`) y solo si el usuario es ADMIN o COORDINADOR.

4. **"El comentario de `matricula-service.ts` dice 'confirmada ya generó el cobro'. ¿Es cierto?"**
   No del todo: el cobro se genera cuando la matrícula se **registra** (evento `matricula.registrada`), no cuando se confirma. El comentario está desactualizado.

5. **"¿Por qué el saldo de una persona es negativo?"**
   Porque ha aprobado pagos por más de lo que tenía a favor. Negativo significa que debe.

6. **"¿El frontend calcula la beca?"**
   No. La beca y el descuento los calcula siempre el backend (`CalculoDescuentoService`); el frontend solo muestra el resultado.

7. **"Si ocultas un botón con `@if`, ¿ya es seguro?"**
   No. Solo mejora la experiencia. El backend valida el rol de nuevo y responde 403.

8. **"¿Qué pasa si la sesión expira en medio de una acción?"**
   El `authInterceptor` intenta renovar el token una vez. Si no puede, lleva al usuario a iniciar sesión otra vez.

---

## Parte 7. Retos prácticos para ensayar en vivo

Hazlos antes de la presentación, cada uno en menos de 3 minutos, y confirma que `npx ng build --configuration development` sigue compilando.

| # | Reto | Archivos |
|---|---|---|
| 1 | Cambiar el texto de "Nuevo pago" a "Registrar pago". | `pago-list.html` |
| 2 | Cambiar el nombre del menú "Pagos" a "Cobros". | `shell.component.html` |
| 3 | Mostrar el botón "Nuevo pago" también a ESTUDIANTE. | `pago-list.html` |
| 4 | Limitar el porcentaje de beca a 80. | `becas-aplicadas-form.html` y `.ts` |
| 5 | Pedir confirmación antes de rechazar un pago. | `pago-list.ts` |
| 6 | Cambiar el placeholder del campo "Motivo" de devoluciones. | `solicitudes-devolucion-form.html` |
| 7 | Cambiar el mensaje de "sin permiso" (403). | `mensaje-error.ts` |
| 8 | Cambiar el título de la columna "Metodo" de la tabla de pagos por "Medio de pago". | `pago-list.html:27` |

Después de cada reto: **deshaz el cambio** con `git restore <archivo>` para dejar el proyecto limpio.

---

## Parte 8. Chuleta de puertos y comandos

| Qué | Dónde |
|---|---|
| Frontend | http://localhost:4200 |
| Gateway (API) | http://localhost:18080 |
| Keycloak | http://localhost:18180 |
| Config Server | http://localhost:18888 |
| Eureka | http://localhost:18761 |
| Kafka | localhost:18092 |
| Base de finanzas | localhost:15457 (`lamb_finanzas_db`) |
| Grafana (logs y métricas, dev) | http://localhost:13000 |

```powershell
# Frontend
cd C:\Practica\Lamb-UPEU\clients\lamb-frontend
npm start
npx ng build --configuration development

# Un microservicio (necesita JDK 21)
cd C:\Practica\Lamb-UPEU\services\lamb-finanzas-ms
.\mvnw spring-boot:run

# Git
git status
git add <archivos>
git commit -m "mensaje"
git push origin main
```

Orden recomendado de arranque: base de datos y Kafka → `lamb-config` → Eureka → Gateway → microservicios → frontend.

---

## Lista de repaso final

- [ ] Puedo dibujar el camino de una petición (pantalla → servicio → interceptor → Gateway → microservicio).
- [ ] Sé dónde está el texto de cualquier botón sin buscar más de 30 segundos.
- [ ] Explico `signal`, `inject`, `subscribe` y `switchMap` con un ejemplo del código.
- [ ] Explico las reglas de becas con un ejemplo numérico.
- [ ] Explico por qué el saldo puede ser negativo.
- [ ] Explico los dos pasos de un reembolso y sus validaciones.
- [ ] Explico cómo una matrícula llega a finanzas sin dar una respuesta de "se llama por HTTP".
- [ ] Sé qué decir cuando no sé algo: "voy a revisar el código" y abrir el archivo que corresponde.
