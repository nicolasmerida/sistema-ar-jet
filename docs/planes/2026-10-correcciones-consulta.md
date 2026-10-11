# Plan de cambios: correcciones de la consulta (octubre 2026)

Correcciones que pidió el asistente sobre la implementación de AR Jet:

1. **Baja lógica** de aviones y aeropuertos: dejan de borrarse de la base y pasan a estado "de baja". Si tienen vuelos vigentes, **se cancelan** en vez de bloquear la baja.
2. **Ver los vuelos vigentes de un aeropuerto** al pasar el mouse (tooltip), con horarios y días.
3. **Descripción** del aeropuerto.
4. **Vuelos que cruzan la medianoche**: se cargan la hora de salida, la hora de llegada y el **día de llegada** (mismo día o día siguiente, como máximo).

Orden sugerido: **C → D → A → B**. C es una columna nueva y no rompe nada. D cambia el modelo de horarios que usan A y B. A cambia la definición de "vigente" que usa B. B va al final porque muestra datos de las tres.

---

## 0. Problemas detectados en el código actual

| # | Dónde | Problema |
|---|---|---|
| P1 | `lib/vuelos/validacion.ts` → `validarHorarios` | Exige `horaLlegada > horaSalida`, así que 23:30 → 00:30 da error. |
| P2 | `vuelo_horario_valido CHECK (hora_llegada > hora_salida)` (SQL del 08/10) | La base también lo rechaza. |
| P3 | `lib/vuelos/actions.ts` → `crearVuelo` | `fecha_llegada = instanteLocal(fecha, horaLlegada)` usa **la misma fecha** que la salida, así que la llegada queda antes que la partida. |
| P4 | `actualizarVuelo`, `UPDATE viaje ...` | Calcula `fecha_llegada` con la fecha de `fecha_partida`, con el mismo problema. |
| P5 | `lib/aeropuertos/data.ts` → `filtroVueloVigente` | "Vigente" = `fin_disp >= hoy`. Un vuelo con **todos sus viajes cancelados** sigue contando como vigente. Con la baja en cascada esto queda mal. |
| P6 | `eliminarAeropuerto` / `eliminarAvion` | Hacen `delete` / `deleteMany` físico. |
| P7 | `obtenerOpcionesFormulario` | Ofrece todos los aeropuertos y aviones, sin filtrar los dados de baja. |

---

## C. Descripción del aeropuerto

**Base**

```sql
ALTER TABLE aeropuerto ADD COLUMN descripcion VARCHAR(500);
```

Es opcional: los aeropuertos que ya están cargados no la tienen.

**Backend**
- `lib/aeropuertos/validacion.ts`: agregar `descripcion` a `DatosAeropuerto` y `LARGO_MAXIMO.descripcion = 500`. **No** es obligatoria: solo se valida el largo, así que no conviene reusar `validarTexto`. Agregar `.trim()` en `normalizarAeropuerto`.
- `lib/aeropuertos/actions.ts`: incluirla en `validarEntrada`, `create` y `update`. Guardar `null` si viene vacía.
- `lib/aeropuertos/data.ts`: agregarla a `AeropuertoListado` y al `select`.

**UI**
- `aeropuerto-form-modal.tsx`: agregar un `<textarea>` "Descripción (opcional)" con contador `n/500`. Hay que cambiar el texto del modal ("Todos los campos son obligatorios" deja de ser cierto) y poner el asterisco solo en los campos obligatorios. `CampoTexto` necesita una prop `obligatorio`.
- Mostrarla en el tooltip (B) y en el detalle del aeropuerto (B).

---

## D. Hora de salida + hora y día de llegada (vuelos que cruzan la medianoche)

### Idea
El formulario pide **hora de salida**, **hora de llegada** y **día de llegada**: *el mismo día* o *el día siguiente*. Como máximo se llega un día después. Ejemplo: sale el martes 23:30 y llega el miércoles 02:00.

Un `vuelo` **no tiene una fecha única**. Las fechas salen de los días de operación y la vigencia, y cada una genera un `viaje`. Por eso el "día de llegada" no se carga como fecha de calendario, sino como "mismo día / día siguiente" respecto de cada salida. **Los días de operación son siempre los días de salida**: un vuelo que opera los martes sale los martes y, si llega al día siguiente, llega los miércoles.

### Base (`prisma/sql/2026-10-XX_vuelo_llegada_dia_siguiente.sql`)

```sql
BEGIN;
ALTER TABLE vuelo
  ADD COLUMN llega_dia_siguiente BOOLEAN NOT NULL DEFAULT false,
  DROP CONSTRAINT vuelo_horario_valido,
  -- Mismo día: la llegada es posterior a la salida.
  -- Día siguiente: la llegada es anterior o igual a la salida (duración de hasta 24 h).
  ADD CONSTRAINT vuelo_horario_valido CHECK (
    (NOT llega_dia_siguiente AND hora_llegada > hora_salida)
    OR (llega_dia_siguiente AND hora_llegada <= hora_salida)
  );
COMMIT;
```

- Los vuelos existentes quedan con `false`, que es correcto porque hasta hoy todos llegaban el mismo día. Sus viajes no se tocan.
- `hora_llegada` **se queda**. Solo se agrega una columna.
- En `viaje` no cambia nada: `fecha_partida` y `fecha_llegada` ya son fecha y hora completas.
- Actualizar `schema.prisma` (`llega_dia_siguiente Boolean @default(false)`) y correr `npx prisma generate`. Conviene probarlo antes en una branch de Neon.
- Revisar que el `CHECK` de `viaje` (`fecha_llegada > fecha_partida`) y la exclusión `viaje_avion_sin_solapamiento` usen los timestamps. Las dos se crearon directo en Neon y no figuran en `prisma/sql/`.

### Validación (`lib/vuelos/validacion.ts`)
- `DatosVuelo`: agregar `llegaDiaSiguiente: boolean`.
- `validarHorarios`:
  - salida y llegada: formato HH:MM, como ahora;
  - **mismo día**: la llegada tiene que ser posterior a la salida. Mensaje: *"La hora de llegada debe ser posterior a la de salida. Si llega al día siguiente, marcalo"*;
  - **día siguiente**: la llegada tiene que ser **anterior o igual** a la hora de salida. Si no, el vuelo duraría más de 24 h (por ejemplo, sale lunes 10:00 y llega martes 12:00, 26 h). Mensaje: *"Un vuelo no puede durar más de 24 horas"*.
- El tope de "un día después como máximo" lo da el propio campo, que solo tiene dos opciones. No hay forma de cargar "llega el domingo".
- `validarEntrada` (server action): leer `llegaDiaSiguiente` solo si es `typeof === "boolean"`; cualquier otro valor cuenta como `false`.

### Generación de viajes (`lib/vuelos/actions.ts`)
- `fechas.ts`: agregar `sumarDias(fecha: "AAAA-MM-DD", n): string`.
- `crearVuelo`:
  - `fecha_partida = instanteLocal(fecha, horaSalida)`
  - `fecha_llegada = instanteLocal(llegaDiaSiguiente ? sumarDias(fecha, 1) : fecha, horaLlegada)`

  Martes 23:30 → `instanteLocal("miércoles", "02:00")`. **Esto arregla P3.** Guardar también `llega_dia_siguiente`.
- `actualizarVuelo`:
  - `cambioHorario` también compara `llega_dia_siguiente`.
  - En el `UPDATE viaje`, la llegada suma un día cuando corresponde:
    ```sql
    fecha_llegada = ((fecha_partida AT TIME ZONE tz)::date
                     + ${llegaDiaSiguiente ? 1 : 0}::int
                     + ${horaLlegada}::time) AT TIME ZONE tz
    ```
    **Esto arregla P4.**
  - En la edición se pueden cambiar las horas y el día de llegada, como ya pasa con los horarios.

### Datos y tipos (`lib/vuelos/data.ts`, `tipos.ts`)
- `VueloListado` y `VueloEditable`: agregar `llegaDiaSiguiente`.

### UI
- `seccion-ruta.tsx`: al lado de "Hora de llegada", un selector **Día de llegada: [Mismo día ▾ / Día siguiente]**. Si hay días de operación marcados, debajo se muestra *"Sale Mar 23:30 → llega Mié 02:00"* para que se entienda.
- `vuelos-table.tsx` y `detalle-vuelo.tsx`: horario `23:30 – 02:00 (+1)` con `title="Llega al día siguiente"`.
- `viajes-table.tsx`: ya formatea desde los timestamps, así que la hora sale bien. Cuando la fecha de llegada es distinta de la de salida, mostrar la fecha de llegada (*"mar 14/10 23:30 → mié 15/10 02:00"*).
- `app/ui/dashboard/flights-table.tsx` y `dashboard-data.ts`: revisar si muestran la llegada.

### Casos de prueba
| Salida | Llegada | Día de llegada | Resultado |
|---|---|---|---|
| Mar 23:30 | 02:00 | Día siguiente | válido, llega Mié 02:00 |
| 10:00 | 12:30 | Mismo día | válido |
| 23:30 | 00:30 | Mismo día | error: marcar día siguiente |
| 10:00 | 12:00 | Día siguiente | error: más de 24 h |
| 10:00 | 10:00 | Día siguiente | válido (24 h exactas, el límite) |
| 10:00 | 10:00 | Mismo día | error |

También hay que probar que, con el mismo avión, un viaje Mar 23:30 → Mié 02:00 y otro Mié 01:00 → 03:00 se rechacen por solapamiento.

---

## A. Baja lógica de aeropuertos y aviones, con cancelación en cascada

### Reglas de negocio (acordadas con el asistente)
1. "Eliminar" / "Dar de baja" **nunca** borra filas: cambia el estado a `de_baja` y registra la fecha.
2. Si hay viajes pendientes **cancelables**, la baja no se bloquea: se cancelan. Un viaje pendiente es uno con `fecha_partida > ahora` y estado distinto de `cancelado` y `finalizado`. Ese es el filtro actual `filtroViajesPendientes`.
2b. **Bloqueo:** si hay algún viaje vigente que **no se puede cancelar**, la baja se rechaza entera y no se cancela nada. Mensaje: *"Este aeropuerto no se puede dar de baja porque tiene vuelos vigentes que no se pueden cancelar"*. En el avión, lo mismo con "avión". Un viaje no se puede cancelar si:
   - sale en **menos de 3 h**, que es la misma regla de US-11 (`ANTICIPACION_MINIMA_CANCELACION_MS`);
   - **ya salió y todavía no llegó**: `fecha_partida <= ahora < fecha_llegada`, en estado `programado`, `demorado` o `en_curso`. No tiene sentido dar de baja el aeropuerto de destino de un avión que está volando hacia él.

   Para no duplicar la regla se reutiliza `bloqueoCancelacion(estado, partida, ahora)` de `lib/vuelos/data.ts`. Cualquier viaje vigente para el que devuelva algo distinto de `null` bloquea la baja. El modal lista esos viajes (número, fecha, hora) para que el admin sepa cuándo puede volver a intentarlo.
3. Los viajes cancelados guardan en `estado` un motivo automático: `"Baja del aeropuerto BHI"` / `"Baja del avión LV-ABC"`.
4. Lo dado de baja **se sigue viendo**: listado con filtro y detalle con los vuelos que tuvo.
5. Lo dado de baja **no se ofrece** al crear o editar vuelos.
6. No se puede editar ni volver a dar de baja algo que ya está de baja.

> **Decidido por el equipo (10/10):** los viajes que salen en menos de 3 h **bloquean** la baja. No se cancelan a la fuerza.

### Base (`prisma/sql/2026-10-XX_baja_logica.sql`)

```sql
BEGIN;
CREATE TYPE estado_registro_t AS ENUM ('activo', 'de_baja');

ALTER TABLE aeropuerto
  ADD COLUMN estado estado_registro_t NOT NULL DEFAULT 'activo',
  ADD COLUMN fecha_baja TIMESTAMPTZ,
  ADD CONSTRAINT aeropuerto_baja_consistente
    CHECK ((estado = 'de_baja') = (fecha_baja IS NOT NULL));

ALTER TABLE avion
  ADD COLUMN estado estado_registro_t NOT NULL DEFAULT 'activo',
  ADD COLUMN fecha_baja TIMESTAMPTZ,
  ADD CONSTRAINT avion_baja_consistente
    CHECK ((estado = 'de_baja') = (fecha_baja IS NOT NULL));
COMMIT;
```

- Se usa un enum y no un `activo boolean` porque el asistente habló de un **estado**, y si después aparece "en mantenimiento" se agrega un valor.
- `codigo_iata` y `matricula` siguen siendo **UNIQUE globales**. Si se carga un código que pertenece a uno dado de baja, el mensaje es *"Ya existe un aeropuerto dado de baja con ese código"*. Reactivar queda opcional y fuera de alcance.

### Filtro único de "vigente" (arregla P5)
En `lib/vuelos/data.ts`:

```ts
/** Un vuelo está vigente si le queda al menos un viaje por salir sin cancelar. */
export function filtroVueloVigente(ahora = new Date()): Prisma.vueloWhereInput {
  return { viaje: { some: filtroViajesPendientes(ahora) } };
}
```

`lib/aeropuertos/data.ts` deja de definir el suyo y usa este. Para aviones, la cuenta pasa a ser los viajes pendientes del avión.

### Backend: aeropuertos (`lib/aeropuertos/actions.ts`)
`eliminarAeropuerto` pasa a llamarse `darDeBajaAeropuerto(id)`. Hace todo en **una transacción** (`OPCIONES_TRANSACCION` como en vuelos):
1. `updateMany({ where: { id_aeropuerto: id, estado: "activo" }, data: { estado: "de_baja", fecha_baja: now } })`. Si `count === 0`, devolver "ya está dado de baja o no existe". El `UPDATE` deja la fila bloqueada hasta el commit.
2. Buscar los viajes vigentes de los vuelos con `origen = id OR destino = id`, es decir `fecha_llegada > ahora` y estado distinto de `cancelado` y `finalizado`, con su `estado`, `fecha_partida` y `numero`.
2b. Si alguno tiene `bloqueoCancelacion(...) !== null`, se hace `rechazar(MENSAJES.bajaBloqueada)` con la lista de esos viajes. Como se lanza dentro de la transacción, **se revierte el paso 1** y el aeropuerto queda activo. El chequeo se hace dentro de la transacción y con el aeropuerto ya bloqueado para que el reloj no cambie entre lo que mostró el modal y lo que se ejecuta. Si el modal decía "se puede" pero justo un viaje cruzó el límite de 3 h, igual se rechaza.
3. `viaje.updateMany(... estado: "cancelado")` y `estado.createMany` (o un upsert como en `cancelarViaje`) con el motivo automático.
4. Contar los pasajes activos de esos viajes (`filtroPasajesActivos`) para el mensaje.
5. Mensaje: *"Aeropuerto BHI dado de baja. Se cancelaron 12 viajes de 3 vuelos (8 reservas afectadas)"*. Dejar el TODO de notificar.
6. `revalidatePath` de `/dashboard/aeropuertos` y de `/dashboard/vuelos` con `"layout"`.

Conviene sacar la cancelación a un helper compartido en `lib/vuelos/cancelacion.ts`, por ejemplo `cancelarViajesEnTx(tx, where, motivo)`. Lo usan `cancelarViaje`, la baja de aeropuerto y la baja de avión.

`actualizarAeropuerto`: rechazar si está `de_baja`.

**Nueva acción** `resumenBajaAeropuerto(id)`. Devuelve `{ vuelos, viajes, reservas, bloqueantes: { numero, partida, motivo }[] }` para mostrarlo en el modal antes de confirmar. Si `bloqueantes` no está vacío, el modal muestra el rechazo directamente. El servidor igual lo vuelve a verificar al confirmar (paso 2b).

### Backend: aviones (`lib/aviones/actions.ts`)
`eliminarAvion` hace lo mismo con `viaje.id_avion = id` en lugar de origen/destino. Se borran el chequeo de `VUELOS_VIGENTES` y `HISTORIAL`, y el `deleteMany`. También se agrega `resumenBajaAvion(id)`.

### Evitar asignar algo dado de baja (arregla P7)
- `obtenerOpcionesFormulario`: `where: { estado: "activo" }`.
- `crearVuelo` y `actualizarVuelo`: dentro de la transacción, verificar que el origen, el destino y el avión estén activos. Hacerlo con `SELECT ... FOR SHARE` vía `$queryRaw`, para que no se cuele una baja simultánea. Si no lo están, devolver *"El aeropuerto seleccionado fue dado de baja"* / *"El avión seleccionado fue dado de baja"*.

### Estado derivado del vuelo
Hoy `estadoDelVuelo` da "finalizado" si no le quedan viajes pendientes y no están todos cancelados. Un vuelo cortado por una baja mostraría "Finalizado", y es engañoso. Regla nueva: si no hay pendientes y **el último viaje (por fecha) está cancelado**, el estado es `"cancelado"`.

### UI: aeropuertos
- `aeropuertos-table.tsx`:
  - El botón pasa de "Eliminar" a **"Dar de baja"**.
  - Las filas de baja se muestran en gris, con el badge *"De baja desde 10/10/2026"* y solo "Ver detalle", sin Editar ni Dar de baja.
- `aeropuertos-manager.tsx`: agregar un selector **Activos / De baja / Todos**, por defecto Activos, al lado del buscador.
- `eliminar-aeropuerto-modal.tsx` pasa a llamarse `baja-aeropuerto-modal.tsx`:
  - Al abrirse llama a `resumenBajaAeropuerto`. Mientras carga muestra un spinner.
  - Con viajes bloqueantes, se reutiliza la pantalla de error actual con el título "No se puede dar de baja", el mensaje *"Este aeropuerto no se puede dar de baja porque tiene vuelos vigentes que no se pueden cancelar"*, la lista *"AN 520 · hoy 18:30 · sale en menos de 3 h"* y un botón "Entendido".
  - Sin vuelos vigentes: *"¿Querés dar de baja BHI? Dejará de ofrecerse como origen y destino. Su historial se conserva."*
  - Con vuelos vigentes, agregar un aviso en ámbar: *"Tiene 3 vuelos vigentes: se cancelarán 12 viajes y se verán afectadas 8 reservas."*
  - Se saca "Esta acción no se puede deshacer".
  - Botones "No" / "Sí, dar de baja".

### UI: aviones
Lo mismo en `aviones-table.tsx`, `aviones-manager.tsx` y `eliminar-avion-modal.tsx`. El modal ya no se bloquea por tener vuelos vigentes, sino por tener viajes que no se pueden cancelar, igual que en aeropuertos.

### UI: vuelos
En la tabla y el detalle, si el aeropuerto o el avión está de baja, mostrar `BHI (de baja)` con un `title`.

### Documentación
Hay que actualizar las US con la comisión analista:
- **US-04** y **US-07**: el camino alternativo 1 pasa a ser *"Aeropuerto/avión con vuelos vigentes → el sistema avisa la cantidad, pide confirmación y cancela los viajes"*.
- **US-03**: agrega la descripción.
- **US-09** y **US-10**: campo "día de llegada" (mismo día / día siguiente).

---

## B. Tooltip con los vuelos vigentes del aeropuerto (+ detalle)

### Datos
Precargar los vuelos en el listado (`obtenerAeropuertos`). El volumen es chico y así el hover no espera a Neon. Se agrega a `AeropuertoListado`:

```ts
vuelosVigentesDetalle: {
  id: number; numero: string;
  sentido: "salida" | "llegada";
  otroAeropuerto: string;           // código IATA del otro extremo
  horaSalida: string; horaLlegada: string; llegaDiaSiguiente: boolean;
  dias: number[];
  proximoViaje: string | null;      // ISO del próximo viaje pendiente
}[]
```

Hay que hacer una sola consulta: `db.vuelo.findMany({ where: { ...filtroVueloVigente(), OR: [origen, destino] } })`, o traer los vuelos vigentes una vez y agruparlos por aeropuerto en memoria. **No** una consulta por aeropuerto, porque sería N+1. `vuelosVigentes` pasa a ser `vuelosVigentesDetalle.length`.

Si en el futuro hay muchos vuelos, la alternativa es una server action `obtenerVuelosDeAeropuerto(id)` que cargue al abrir el tooltip, con caché en el cliente.

### Componente
`app/ui/dashboard/aeropuertos/tooltip-aeropuerto.tsx` (cliente, sin librerías nuevas):
- **Disparador**: el código IATA y el nombre de la fila. Se abre con `mouseenter` (300 ms de demora) y con `focus` para usarlo con teclado. Se cierra con `mouseleave`, `blur` o `Esc`. En pantallas táctiles se abre con un tap.
- **Contenido**:
  - Encabezado: **BHI – Comandante Espora**, Bahía Blanca, Argentina.
  - Descripción, si tiene.
  - "Salidas (n)" y "Llegadas (n)", con una línea por vuelo: `AN 520 → AEP · 20:00–02:00⁺¹ · Lun · Mié · Vie · próximo: mié 14/10`.
  - Muestra 5 vuelos como máximo y el link *"Ver los N vuelos"* lleva al detalle.
  - Sin vuelos: *"Sin vuelos vigentes"*.
  - De baja: *"Dado de baja el 10/10/2026"*.
- **Accesibilidad**: `role="tooltip"` y `aria-describedby`. Posición `absolute`. Si no entra abajo, se abre arriba.
- Se puede reusar en `vuelos-table.tsx` sobre los códigos de origen y destino.

### Página de detalle `/dashboard/aeropuertos/[id]`
Cubre "ver en detalle" y el pedido de **consultar lo dado de baja**:
- Datos del aeropuerto, descripción y estado con fecha de baja.
- Tabla de **vuelos vigentes**, que reusa el estilo de `vuelos-table`.
- Tabla de **historial**: todos los vuelos que tuvo, con su estado. Ahí se ven los que se cancelaron por la baja, con el motivo.
- Archivos: `app/dashboard/aeropuertos/[id]/page.tsx` (fino), `lib/aeropuertos/data.ts` → `obtenerDetalleAeropuerto(id)`, y `app/ui/dashboard/aeropuertos/detalle-aeropuerto.tsx`.
- Para aviones conviene hacer el equivalente `/dashboard/aviones/[id]`, con los viajes que tuvo asignados. Va con prioridad baja.

---

## Checklist de verificación (antes de la demo)
- [ ] Alta de un vuelo Mar 23:30 → 02:00 (día siguiente). Los viajes llegan el miércoles y se muestra "+1".
- [ ] Editar un vuelo cambiando la hora o el día de llegada actualiza los viajes pendientes y no toca los pasados.
- [ ] La baja de un aeropuerto sin vuelos lo deja en estado de baja: sigue en la base y aparece en el filtro "De baja".
- [ ] La baja de un aeropuerto con vuelos cancela solo los viajes pendientes, con motivo. Los pasados quedan como estaban.
- [ ] La baja de un aeropuerto con un viaje que sale en menos de 3 h se rechaza con el mensaje correspondiente, no cancela ningún viaje y el aeropuerto sigue activo.
- [ ] La baja de un aeropuerto con un viaje en vuelo hacia él se rechaza.
- [ ] Después de la baja, el aeropuerto no aparece en el formulario de vuelos y su contador de vigentes queda en 0.
- [ ] El vuelo afectado muestra el estado "Cancelado", no "Finalizado".
- [ ] Lo mismo para la baja de un avión.
- [ ] Una server action llamada con un aeropuerto o avión dado de baja se rechaza.
- [ ] El tooltip abre con mouse y con teclado, y muestra horarios, días y descripción.
- [ ] El detalle de un aeropuerto dado de baja muestra su historial de vuelos.
- [ ] `npm run lint` y `npm run build` pasan sin errores.
