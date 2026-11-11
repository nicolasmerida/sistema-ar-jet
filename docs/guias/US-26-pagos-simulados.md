# US-26: pagos simulados

## Recorrido

Desde el resumen de una reserva pendiente, seleccionar tarjeta y presionar "Ir a pagar".
Completar titular, número de tarjeta, vencimiento y código de seguridad. El pago exitoso
redirige al resumen con el estado Pagada, referencia, fecha e importe abonado.
"Cancelar" vuelve al resumen sin registrar un pago ni cancelar la reserva.

## Datos ficticios para probar

| Resultado | Número | Vencimiento | Código de seguridad |
| --- | --- | --- | --- |
| Aprobación | 4111 1111 1111 1111 | Cualquier mes vigente, por ejemplo 12/30 | 123 |
| Rechazo | 4000 0000 0000 0002 | Cualquier mes vigente, por ejemplo 12/30 | 123 |

El titular puede ser "María González". No usar tarjetas reales: no hay pasarela ni cobros.
Solo se persisten los últimos cuatro dígitos; nunca el número completo ni el código de seguridad.

## Disponibilidad y precio

- Las reservas pendientes no descuentan lugares. Solo cuentan como vendidos los pasajes pagados y no cancelados.
- La cantidad sigue limitada a nueve por la US-25, tanto al reservar como al pagar.
- El precio unitario queda guardado al reservar. El total del pago se calcula en el servidor con esos precios.
- El último asiento se verifica dentro de una transacción, bloqueando viaje y compra.
- Repetir una compra pagada conserva su referencia; no produce otra venta.
- Mostrador sigue disponible como modalidad pendiente; el cobro en mostrador y los documentos de US-27 no forman parte de US-26.

## Base de datos

Aplicar `arjet/prisma/sql/2026-11-11_pagos_simulados.sql` y ejecutar `npx prisma generate`
desde `arjet`. La migración conserva registros existentes. Para reservas anteriores que
no tenían precio guardado, toma la tarifa disponible al migrar; no reconstruye precios históricos desconocidos.

## Verificación

Desde `arjet`:

```powershell
node --test tests/*.test.mjs
npm run build
npm run lint
```

Prueba de integración con Node.js 24 y acceso a la base configurada:

```powershell
node tests/pago.integration.mjs
```

La integración crea un esquema temporal con registros ficticios y lo elimina en `finally`.
Comprueba propiedad de reservas, rechazo, rollback real, dos pagos simultáneos por el
último asiento e idempotencia, sin modificar compras reales.
