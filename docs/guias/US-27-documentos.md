# US-27: factura y tickets electrónicos

## Recorrido

El pago exitoso guarda una tarea de emisión y una copia de los datos originales de
la compra dentro de su propia transacción. Se reserva un número de factura por
compra y un número de ticket por pasaje comprado. Los pagos rechazados o cancelados
antes de aprobarse no crean documentos.

Después del pago se intenta emitir inmediatamente. La confirmación muestra
"Compra realizada correctamente" y las descargas. Las compras pagadas y su
historial se consultan en **Mis compras**, junto a la gestión de cancelaciones.
**Reservas** conserva las operaciones que todavía no tienen una compra pagada.

Los PDFs contienen los datos originales, no valores recalculados desde la tarifa o
los datos personales actuales. Una cancelación posterior conserva la factura y
el ticket como historial; el ticket aparece Cancelado y sigue siendo inválido para
check-in.

## Ejecución y reintentos

```powershell
cd arjet
npm install
npx prisma generate
npm run dev
```

`npm run dev` y `npm start` inician tanto Next.js como el worker de documentos.
Para ejecutar el worker como proceso independiente:

```powershell
npm run documentos:worker
```

Debe permanecer activo para procesar tareas pendientes aunque el pasajero cierre
el navegador. Revisa la cola cada cinco segundos. Los fallos se reintentan con
espera creciente, hasta un máximo de cinco minutos entre intentos.

Las tareas se reclaman con `FOR UPDATE SKIP LOCKED` y un bloqueo de dos minutos
con token. Otro worker recupera una tarea si su proceso se interrumpe y vence
el bloqueo. Cada PDF guardado queda emitido e inmutable; los reintentos generan
solo los documentos faltantes. La interfaz se actualiza mientras hay documentos
pendientes y permite solicitar un reintento manual.

## Persistencia y privacidad

Aplicar `arjet/prisma/sql/2026-11-11_documentos_compra.sql` antes de iniciar la nueva
versión y regenerar Prisma. La migración prepara también la documentación de
pagos anteriores con importe y fecha registrados. Para esas compras antiguas
solo se pueden conservar los nombres y horarios conocidos al migrar.

Los PDFs se guardan como `BYTEA` en PostgreSQL, fuera de `public/`. La ruta
`/vuelos/compras/documentos/[id]` verifica rol y propiedad en cada solicitud,
devuelve `403` para acceso ajeno y sirve las descargas con caché deshabilitada.
Las páginas reciben únicamente metadatos, nunca los archivos completos.

La factura usa numeración interna y corresponde al alcance de pago simulado de
la aplicación. No integra servicios de facturación fiscal ni envía emails.

## PDF y fuente

Se usa [pdf-lib](https://pdf-lib.js.org/docs/api/classes/pdfdocument) en el servidor.
La fuente Noto Sans se incluye localmente con su licencia SIL en
`arjet/assets/fonts/OFL.txt`; el archivo se incluye en el trazado de producción de
Next.js. Origen de la fuente: [Noto Fonts](https://github.com/notofonts/noto-fonts).

## Pruebas

Desde `arjet`:

```powershell
node --test tests/*.test.mjs
npm run lint
npm run build
```

La integración requiere Node.js 24 y conexión a la base configurada:

```powershell
node tests/pago.integration.mjs
```

Crea un esquema temporal con datos ficticios y lo elimina al finalizar. Comprueba
rollback del pago junto a su emisión, privacidad, fallo parcial, recuperación de
worker, dos procesadores concurrentes, PDFs válidos, snapshots inmutables e historial
tras cancelar. Cada cambio de `search_path` queda limitado a una transacción para
no interferir con conexiones agrupadas de la aplicación.
