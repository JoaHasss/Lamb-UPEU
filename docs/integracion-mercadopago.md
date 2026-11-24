# Integración con Mercado Pago

Este documento explica cómo está integrado Mercado Pago en Lamb-UPEU: qué archivos intervienen, cómo fluye un pago de principio a fin, cómo se configura y qué errores son típicos.

> Alcance: describe lo que hay en el código a la fecha de escritura. Donde algo no se pudo comprobar en el código, se indica.

---

## 1. Visión general

La integración vive casi toda en **`lamb-finanzas-ms`** (backend) y en el módulo `features/pagos` del **frontend Angular**. Hay **dos formas** de cobrar con Mercado Pago:

| | **Checkout Pro** (la que usa la UI hoy) | **Orders API directa** (cobro con tarjeta) |
|---|---|---|
| Quién muestra el formulario de pago | La página de Mercado Pago | Tu propio frontend |
| Qué datos de tarjeta toca tu sistema | Ninguno | Solo un `cardToken` (la tarjeta la tokeniza el SDK JS de MP en el navegador) |
| Endpoint | `POST /api/v1/pagos/{id}/preferencia` y `POST /api/v1/pagos/{id}/confirmar-mercadopago` | `POST /api/v1/pagos/{id}/pasarela` |
| Métodos disponibles | Los que MP ofrezca: tarjeta, Yape, PagoEfectivo, saldo MP… | Solo tarjeta de crédito |
| Estado en el código | Conectada al frontend | Implementada en backend y en `PagoService` del frontend, **pero ninguna pantalla la invoca** |

Además, cada intento de cobro se registra como log en **`lamb-ingresos-pagos-ms`** (tabla `LogTransaccionPasarela`), y cuando un pago queda aprobado se publica el evento Kafka **`pago.aceptado`**, que cierra la saga de matrícula (ver `B-LEARNING.md` y la sección 8).

---

## 2. Mapa de archivos

### Backend — `services/lamb-finanzas-ms/src/main/java/pe/edu/upeu/lamb/finanzas/`

| Archivo | Para qué sirve |
|---|---|
| `config/MercadoPagoProperties.java` | Lee el bloque `mercadopago:` de la configuración (`public-key`, `access-token`, `back-url-*`, `notification-url`). |
| `config/MercadoPagoSdkConfig.java` | Al arrancar, llama a `MercadoPagoConfig.setAccessToken(...)`. Desde ahí, todos los clientes del SDK usan ese token. |
| `service/PasarelaPagoService.java` | **El núcleo.** Crea preferencias, confirma pagos, cobra con tarjeta, traduce estados de MP a estados propios y dispara el abono y el evento. |
| `controller/PagoController.java` | Expone los endpoints REST bajo `/api/v1/pagos`. |
| `dto/PagoPasarelaRequest.java` | Cuerpo de `/pasarela`: `cardToken` y `payerEmail` (ambos obligatorios; el email se valida). |
| `dto/PreferenciaPagoResponse.java` | Respuesta de `/preferencia`: `preferenceId`, `initPoint`, `sandboxInitPoint`. |
| `entity/MetodoPago.java` | Enum: `TARJETA, YAPE, PLIN, TRANSFERENCIA, EFECTIVO, MERCADOPAGO`. |
| `client/IngresosPagosPasarelaClient.java` | Llamada máquina-a-máquina a `lamb-ingresos-pagos-ms` para guardar el log de cada intento. |
| `messaging/PagoEventosProducer.java` | Publica `pago.aceptado` en Kafka **después del commit** de la transacción. |

### Configuración — `infra/lamb-config/config-repo/`

| Archivo | Contenido |
|---|---|
| `lamb-finanzas-ms-dev.yml` | Bloque `mercadopago:` con credenciales de **desarrollo** (hay que pegarlas a mano). |
| `lamb-finanzas-ms-prod.yml` | Lo mismo, pero leyendo `${MP_PUBLIC_KEY}` y `${MP_ACCESS_TOKEN}` de variables de entorno. |
| `lamb-gateway-dev.yml` | La ruta `lamb-finanzas-pagos` (`/api/v1/pagos/**`) apunta a `lamb-finanzas-ms`. |

### Frontend — `clients/lamb-frontend/src/`

| Archivo | Para qué sirve |
|---|---|
| `index.html` | Carga el SDK JS de Mercado Pago: `https://sdk.mercadopago.com/js/v2`. |
| `environments/environment.ts` | Guarda `mercadoPago.publicKey` (la misma Public Key que el backend). |
| `app/features/pagos/pago-service.ts` | Cliente HTTP: `crearPreferencia`, `confirmarMercadoPago`, `pagarConPasarela`, `aceptar`, `rechazar`, `reembolsar`. |
| `app/features/pagos/pago-form.ts` | Pantalla **Nuevo pago** (`/pagos/nueva`). |
| `app/features/pagos/pago-list.ts` | Lista de pagos; el botón **Pagar** de un cargo pendiente llama a `crearPreferencia`. |
| `app/features/pagos/pago-resultado.component.ts` | Pantalla a la que vuelve el navegador desde MP (`/pagos/resultado`). |
| `app/features/publico/pagar.component.ts` | Pantalla pública con botones "Pagar con Yape / BCP / Mercado Pago". No tracé qué endpoint invoca su método `pagar()`. |

---

## 3. Los estados de un pago

`Pago` pasa por estos estados (`EstadoPago`):

```
PENDIENTE ──(crearPreferencia)──► EN_PROCESO ──(MP aprueba)────► APROBADO ──(reembolsar)──► REEMBOLSADO
   │                                   │
   │                                   ├──(MP pendiente/in_process)──► sigue EN_PROCESO
   │                                   └──(MP rechaza)───────────────► RECHAZADO
   └── cargo generado solo, p. ej. al registrar una matrícula
```

- **PENDIENTE**: existe el cargo (la deuda) pero nadie ha intentado pagarlo.
- **EN_PROCESO**: hay un intento de pago en curso. También es el estado en que un admin puede `aceptar()` o `rechazar()` a mano.
- **APROBADO / RECHAZADO / REEMBOLSADO**: estados finales.

---

## 4. Flujo 1 — Checkout Pro (el que usa la UI)

### Diagrama

```
 Navegador (Angular)            lamb-finanzas-ms                    Mercado Pago
 ───────────────────            ────────────────                    ────────────
 1. POST /pagos  ───────────►  procesar(): crea Pago EN_PROCESO
                ◄───────────   devuelve {id}

 2. POST /pagos/{id}/preferencia ► crearPreferencia()
                                  arma item + back_urls + external_reference
                                  ───── POST /checkout/preferences ───►
                                  ◄──── {id, init_point, ...} ─────────
                ◄───────────   {preferenceId, initPoint, sandboxInitPoint}

 3. window.location.href = initPoint ─────────────────────────────────► Página de pago de MP
                                                                         (el usuario elige tarjeta,
                                                                          Yape, PagoEfectivo…)
 4. MP redirige a back_url:
    /pagos/resultado?pagoId=7&payment_id=123456&status=approved… ◄─────

 5. POST /pagos/7/confirmar-mercadopago?paymentId=123456
                               ► confirmarPago()
                                  ───── GET /v1/payments/123456 ─────►
                                  ◄──── {status, payment_type_id, …} ──
                                  aplicarResultado(): estado, abono,
                                  log, evento Kafka
                ◄───────────   PagoResponse (APROBADO / EN_PROCESO / RECHAZADO)
```

### Paso a paso con el código

**Paso 1 — Crear el pago.** `PagoForm.guardar()` llama a `PagoService.procesar()` con `metodo: 'MERCADOPAGO'`. En el backend, `PagoService.procesar()` guarda el `Pago` como `EN_PROCESO` con una `referenciaExterna` aleatoria.

**Paso 2 — Crear la preferencia** (`PasarelaPagoService.crearPreferencia`, línea 75). Una *preferencia* es la "orden de cobro" que le dices a Mercado Pago. Se construye con:

- **item**: título = concepto del pago, cantidad 1, precio = monto.
- **back_urls** (`success`, `pending`, `failure`): a dónde vuelve el navegador. A cada una se le añade `?pagoId=<id>`. Esto es importante: Mercado Pago **no** devuelve el `external_reference` como parámetro en la URL, así que esta es la única forma de que la pantalla de retorno sepa qué pago confirmar.
- **external_reference**: `"pago-<id>"`, para poder cruzar el pago de MP con el tuyo.
- **notification_url**: dónde MP avisaría por webhook (ver sección 9).

Después de crear la preferencia, si el cargo estaba `PENDIENTE` (caso de un cargo de matrícula), pasa a `EN_PROCESO` con método `MERCADOPAGO`.

> `auto_return` no se envía a propósito: MP lo exige solo con URLs públicas `https`, y en localhost lo rechazaría. En dev el usuario vuelve con el botón manual de MP.

**Paso 3 — Redirigir.** El frontend hace `window.location.href = pref.initPoint || pref.sandboxInitPoint`. Con credenciales de usuario de prueba (`APP_USR-…`) se usa `initPoint`, no el sandbox.

**Paso 4 — Vuelta.** MP devuelve al navegador a `/pagos/resultado`, agregando `payment_id` (y otros) a la URL que ya traía `pagoId`.

**Paso 5 — Confirmar.** `PagoResultadoComponent` lee `pagoId` y `payment_id`; si falta alguno muestra "Mercado Pago no devolvió los datos esperados". Si están, llama a `confirmarMercadoPago`. El backend (`confirmarPago`, línea 122):

1. Verifica que el pago esté `EN_PROCESO`.
2. **Consulta a MP** el pago real (`PaymentClient().get(paymentId)`), sin fiarse de lo que diga la URL.
3. Deduce el método real con `metodoDesdeMercadoPago` (tabla de la sección 6).
4. Aplica el resultado (sección 7).

---

## 5. Flujo 2 — Orders API directa (cobro con tarjeta)

Endpoint: `POST /api/v1/pagos/{id}/pasarela`, cuerpo `{ "cardToken": "...", "payerEmail": "..." }`.

Idea: el navegador usa el **SDK JS de MP** (cargado en `index.html`) con la **Public Key** para convertir los datos de la tarjeta en un `cardToken`. Ese token, y no la tarjeta, es lo único que viaja a tu backend. Así tu sistema no maneja datos de tarjeta.

`PasarelaPagoService.pagarConTarjeta` (línea 68):

1. Busca el pago y exige que esté `EN_PROCESO`.
2. `crearOrdenEnMercadoPago` crea una `Order` de tipo `online` con el monto, la descripción, el `external_reference`, el email del pagador y un pago con `type: credit_card`, `installments: 1` y el token.
3. Toma `orden.getTransactions().getPayments().get(0)` y aplica el resultado.

**Detalles y limitaciones del código actual:**

- La marca de la tarjeta está **fija en `"master"`** (línea 218). La Orders API no la infiere del token, así que con una Visa o Amex este flujo puede fallar. Habría que recibirla desde el frontend (el SDK JS la entrega al tokenizar).
- Siempre usa **1 cuota**.
- Esta vía existe porque el comentario del código dice que la antigua Payments API (`/v1/payments`) la rechaza esta cuenta con *"Unauthorized use of live credentials"*. Y `PagoService` (frontend) anota que en esta cuenta **Checkout Pro falla al cobrar** (pantalla `/fatal/`). Es decir: el código documenta que cada vía tiene un problema con la cuenta actual de MP.
- **Ninguna pantalla del frontend llama hoy a `pagarConPasarela`**, y tampoco hay código que tokenice la tarjeta con el SDK. El endpoint está listo en backend, pero falta la interfaz.

---

## 6. Traducción de métodos de pago

En Checkout Pro el usuario elige el método dentro de MP. Al confirmar, `metodoDesdeMercadoPago` (línea 162) lo convierte a tu enum:

| Dato de Mercado Pago | Tu `MetodoPago` |
|---|---|
| `payment_method_id = yape` | `YAPE` |
| `payment_type_id` = `credit_card`, `debit_card`, `prepaid_card` | `TARJETA` |
| `payment_type_id` = `ticket`, `atm` (PagoEfectivo, agentes) | `EFECTIVO` |
| `payment_type_id = bank_transfer` | `TRANSFERENCIA` |
| `payment_type_id` nulo, `account_money` u otro | `MERCADOPAGO` (genérico) |

---

## 7. Qué pasa al aplicar el resultado

`aplicarResultado` (línea 177) es el punto común de ambos flujos. Interpreta el estado de MP:

| Estado de MP | ¿Qué significa? | Estado del `Pago` |
|---|---|---|
| `approved` (Payments API) | Cobro exitoso | `APROBADO` |
| `processed` + detalle `accredited` (Orders API) | Cobro exitoso (otro nombre) | `APROBADO` |
| `pending` / `in_process` | Esperando (p. ej. PagoEfectivo aún no pagado en agente, o tarjeta en revisión) | sigue `EN_PROCESO` |
| cualquier otro | Rechazado | `RECHAZADO` |

Efectos según el resultado:

- **Aprobado** → `saldoCuentaService.abonarPago()` (abona el saldo de la cuenta del estudiante) y se publica `pago.aceptado` en Kafka.
- **Rechazado y sin matrícula asociada** (un trámite suelto) → `anularCargoPago()`: el cargo se anula. Si es de matrícula **no** se anula; la deuda se mantiene y se cancela por otro trámite ("Cancelación de cargo de matrícula").
- **Pendiente** → no pasa nada; se puede volver a confirmar después.
- **Siempre** → `registrarLog(...)` envía a `lamb-ingresos-pagos-ms` un registro con proveedor `MERCADOPAGO`, referencia externa, estado y un payload JSON. Si ese servicio falla, solo se escribe un warning: el log nunca rompe el pago.

---

## 8. Conexión con la saga de matrícula

Cuando un pago de una matrícula queda `APROBADO`, `PagoEventosProducer.publicarTrasCommit` envía `pago.aceptado` (con `matriculaId`, `idPersona`, `monto`) al topic `pago-aceptado-eventos`. `lamb-matricula-ms` lo consume en `PagoEventosConsumer` y llama a `MatriculaService.confirmar()`, que pasa la matrícula de `REGISTRADA` a `CONFIRMADA`.

Es decir: **pagar con Mercado Pago es lo que confirma la matrícula.** El evento se envía solo *después* del commit de la transacción, para no avisar de un pago que luego se revierta.

---

## 9. Configuración

### Credenciales

Hacen falta dos valores de la aplicación de Mercado Pago (panel de desarrolladores → tu aplicación → **Credenciales de prueba**):

- **Public Key**: no es secreta; la usa el navegador.
- **Access Token**: **secreto**; solo lo usa el backend.

### Desarrollo

1. `infra/lamb-config/config-repo/lamb-finanzas-ms-dev.yml`:
   ```yaml
   mercadopago:
     public-key: <tu Public Key de prueba>
     access-token: <tu Access Token de prueba>
     back-url-success: http://localhost:4200/pagos/resultado
     back-url-pending: http://localhost:4200/pagos/resultado
     back-url-failure: http://localhost:4200/pagos/resultado
     notification-url: http://localhost:4200/
   ```
2. `clients/lamb-frontend/src/environments/environment.ts` → `mercadoPago.publicKey`: **la misma** Public Key.
3. Reiniciar **primero `lamb-config` y luego `lamb-finanzas-ms`** (finanzas lee la configuración al arrancar).
4. Para no subir el token por error a Git:
   `git update-index --skip-worktree infra/lamb-config/config-repo/lamb-finanzas-ms-dev.yml`

### Producción

`lamb-finanzas-ms-prod.yml` usa `${MP_PUBLIC_KEY}` y `${MP_ACCESS_TOKEN}`: define esas **variables de entorno** en el despliegue. El archivo `-prod.yml` del repositorio no contiene `back-url-*`; habría que añadirlas con URLs públicas `https`.

### Webhook (notification_url)

En dev, `localhost` no es alcanzable desde Mercado Pago, así que **el aviso automático no llega**. Por eso existe el endpoint manual `confirmar-mercadopago`, y la confirmación depende de que el usuario vuelva al navegador. No encontré en el código un endpoint receptor de webhooks: si el usuario cierra la pestaña antes de volver, el pago queda `EN_PROCESO` hasta que alguien lo confirme.

---

## 10. Endpoints de referencia

Todos bajo el Gateway: `http://localhost:18080/api/v1/pagos/...` (requieren JWT de Keycloak).

| Método y ruta | Qué hace |
|---|---|
| `POST /api/v1/pagos` | Registra un pago (`EN_PROCESO`). |
| `POST /api/v1/pagos/{id}/preferencia` | Crea la preferencia de Checkout Pro; devuelve `initPoint`. |
| `POST /api/v1/pagos/{id}/confirmar-mercadopago?paymentId=…` | Consulta a MP y confirma el pago tras volver del Checkout. |
| `POST /api/v1/pagos/{id}/pasarela` | Cobra con tarjeta por la Orders API (`cardToken` + `payerEmail`). |
| `POST /api/v1/pagos/{id}/aceptar` / `rechazar` | Validación manual por un admin/coordinador. |
| `POST /api/v1/pagos/{id}/reembolsar` | Reembolso (exige solicitud de devolución APROBADA). |

---

## 11. Errores frecuentes

| Síntoma | Causa probable | Qué hacer |
|---|---|---|
| `No se pudo iniciar el pago en Mercado Pago… 403 PA_UNAUTHORIZED_RESULT_FROM_POLICIES (blocked_by PolicyAgent)` | El Access Token es inválido, es el texto de ejemplo `PEGA_AQUI_…`, o la cuenta/aplicación no tiene permiso. | Pegar credenciales reales de prueba, reiniciar `lamb-config` y luego finanzas. Comprobar el token con `curl.exe -H "Authorization: Bearer $env:T" https://api.mercadopago.com/users/me`. |
| `Unauthorized use of live credentials` | Credenciales de producción usadas contra la API clásica. | Usar credenciales de **prueba** de una aplicación nueva. |
| Pantalla `/fatal/` en la página de MP | Restricción de la cuenta con Checkout Pro (anotada en `pago-service.ts`). | Probar con otra aplicación/cuenta de prueba. |
| `Mercado Pago no devolvió los datos esperados (pagoId / payment_id)` | El usuario volvió sin pagar, o MP no agregó `payment_id`. | Reintentar el pago desde la lista. |
| `No se puede pagar con pasarela el pago N: esta en estado …` | El pago no está en el estado esperado (`PENDIENTE`/`EN_PROCESO`). | Revisar el estado del pago. |
| Pago `EN_PROCESO` indefinido tras pagar | No llegó el webhook y el usuario no volvió al navegador. | Llamar manualmente a `confirmar-mercadopago` con el `payment_id`. |
| Cargo de matrícula sigue pendiente tras rechazo | Por diseño, un rechazo de matrícula no anula el cargo. | Usar "Cancelación de cargo de matrícula". |

---

## 12. Mejoras pendientes sugeridas

1. **Webhook real** para no depender de que el usuario vuelva al navegador (requiere una URL pública).
2. **Marca de tarjeta dinámica** en `crearOrdenEnMercadoPago` en vez de `"master"` fijo, y cuotas configurables.
3. **Interfaz para `pagarConPasarela`**: tokenizar con el SDK JS usando la Public Key y llamar al endpoint.
4. **Reintentos del log** a `lamb-ingresos-pagos-ms` o un patrón *outbox*: hoy, si falla, solo queda un warning.
5. **Validar el monto** devuelto por MP contra el del `Pago` antes de aprobar (hoy se confía en el estado, no se compara el importe).
