User Stories

 Validación de límite de compra

ID: US-25

Prioridad: Alta

Estimación: 3 hs  Sprint: 3

Alumno asignado: Alumno 1

Historia de Usuario
Como pasajero, necesito poder indicar la cantidad de pasajes que quiero
comprar en una misma operación, con un máximo de 9 del mismo
con la finalidad de comprar pasajes para varias personas a la vez respetando la
regla de negocio de la aerolínea.

Criterio de aceptación
Dado que soy un pasajero autenticado y seleccioné un vuelo y una clase con
asientos libres,
Cuando elijo una cantidad de pasajes entre 1 y 9 y presiono "Continuar",
Entonces el sistema registra la cantidad elegida y me permite avanzar al pago.
Dado que intento comprar 10 o más pasajes, ya sea desde la interfaz o mediante
una llamada directa al backend,
Cuando el sistema procesa la solicitud,
Entonces la rechaza con el mensaje "No es posible comprar más de 9 pasajes
por transacción" y no registra la reserva.

Descripción más detallada
Camino de éxito

1. El pasajero busca vuelos, selecciona un vuelo y elige la clase.
2. El sistema muestra un selector de cantidad de pasajes con valores de 1 a 9.
3. El pasajero elige la cantidad deseada.
4. Presiona "Continuar".
5. El sistema valida en el backend que la cantidad no supere 9 ni los asientos
libres de la clase, registra la reserva y muestra el resumen con la cantidad y el
total a pagar.

Caminos alternativos

1. Cantidad mayor a 9.

a. Se envía una solicitud con 10 o más pasajes (por ejemplo, alterando la
petición al backend).
b. El backend rechaza la operación y muestra el mensaje "No es posible
comprar más de 9 pasajes por transacción".

2. Cantidad mayor a los asientos disponibles.

a. El pasajero elige una cantidad mayor a los asientos libres que quedan en
la clase.
b. El sistema muestra el mensaje "Solo quedan [X] asientos disponibles en
esta clase" y no permite continuar.

3. Cantidad vacía o inválida.

a. El pasajero no selecciona una cantidad o se envía un valor menor a 1.
b. El sistema marca en rojo el campo y no habilita el botón "Continuar".

4. Error de conexión con la base de datos.

a. Ocurre un error de comunicación al validar la reserva.
b. El sistema informa que no se pudo registrar la reserva y sugiere reintentar
más tarde.

Wireframe asociado: wireframe_seleccion_reserva.png (se agrega el selector de
cantidad de pasajes).
Nota: Según el RF17, depende de la selección y reserva (RF16, US-18). La
validación debe hacerse tanto en la interfaz como en el backend. El control de
asientos libres reutiliza la lógica de concurrencia de la US-18 para evitar
sobreventa.

 Gestión de pagos

ID: US-26

Prioridad: Alta

Estimación: 8 hs  Sprint: 3

Alumno asignado: Alumno 2

Historia de Usuario
Como pasajero, necesito poder ingresar mis datos de pago y confirmar la
compra de los pasajes reservados
con la finalidad de concretar la compra de forma autónoma sin tener que
acercarme a un mostrador.

Criterio de aceptación
Dado que soy un pasajero autenticado con una reserva vigente y estoy en la
pantalla de pago,
Cuando ingreso datos de pago válidos y presiono "Pagar",
Entonces el sistema registra la transacción como exitosa, descuenta los asientos
de la clase y marca la reserva como "Pagada".
Dado que el pago es rechazado,
Cuando el sistema procesa la respuesta,
Entonces no registra la venta, no descuenta asientos y me informa el motivo para
que pueda reintentar.

Descripción más detallada
Camino de éxito

1. El pasajero confirma el resumen de su reserva y presiona "Ir a pagar".
2. El sistema muestra el total a pagar y el formulario de pago.
3. El pasajero ingresa los datos del titular, número de tarjeta, fecha de
vencimiento y código de seguridad.
4. Presiona "Pagar".

5. El sistema simula la autorización del pago, registra la transacción, descuenta
los asientos dentro de una transacción de base de datos y cambia la reserva a
"Pagada".
6. El sistema muestra el mensaje "Pago realizado correctamente" y redirige a la
pantalla de confirmación de la compra.

Caminos alternativos

1. Datos de pago incompletos o con formato inválido.

a. El pasajero deja campos vacíos, ingresa un número de tarjeta inválido o
una fecha de vencimiento pasada.
b. El sistema marca en rojo los campos con error, muestra el motivo debajo
de cada uno y no habilita el pago.

2. Pago rechazado.

a. La simulación devuelve un rechazo (por ejemplo, con una tarjeta de
prueba configurada para rechazar).
b. El sistema muestra el mensaje "El pago fue rechazado. Verifique los
datos o utilice otro medio de pago", no descuenta asientos y mantiene la
reserva para reintentar.

3. Asientos ya no disponibles al momento de pagar.

a. Mientras el pasajero completaba el pago, otro pasajero compró los
últimos asientos de la clase.
b. El sistema no registra el pago, muestra el mensaje "Los asientos
seleccionados ya no están disponibles" y lo devuelve a los resultados de
búsqueda.

4. El pasajero cancela el pago.

a. El pasajero presiona "Cancelar" en la pantalla de pago.
b. El sistema no registra ninguna transacción y lo devuelve al resumen de la
reserva.

5. Error de conexión con la base de datos.

a. Ocurre un error de comunicación al registrar la transacción.
b. El sistema deshace la operación (rollback), no descuenta asientos e
informa que no se pudo completar el pago, sugiriendo reintentar más tarde.

Wireframe asociado: wireframe_pago.png.
Nota: Según el RF18, depende de la selección y reserva (RF16, US-18) y de la
validación de límite de compra (RF17, US-25). Según el alcance del sistema, el
pago es simulado y no se integra con una pasarela real. Los asientos solo se
descuentan ante un pago exitoso. Los datos de tarjeta no deben almacenarse
completos (resguardo de datos personales, RNF01). El pago en efectivo en
mostrador corresponde al RF23, que tiene otra prioridad.

 Emisión de pasajes y facturación

ID: US-27

Prioridad: Alta

Estimación: 8 hs  Sprint: 3

Alumno asignado: Alumno 3

Historia de Usuario
Como pasajero, necesito que al completar el pago el sistema genere la factura
de mi compra y un ticket electrónico por cada pasajero
con la finalidad de contar con la documentación de la compra para presentarme
a volar.

Criterio de aceptación
Dado que soy un pasajero autenticado y el pago de mi reserva fue exitoso,
Cuando el sistema registra la transacción,
Entonces genera una factura con el detalle de la compra y un ticket electrónico
por cada pasaje, cada uno con su código de reserva, y los muestra en la pantalla
de confirmación y en la sección "Mis compras".
Dado que el pago no fue exitoso,
Cuando el sistema procesa la reserva,
Entonces no emite factura ni tickets.

Descripción más detallada
Camino de éxito

1. El pago de la reserva se registra como exitoso (US-26).
2. El sistema genera la factura con número, fecha, datos del comprador, detalle
de los pasajes (vuelo, fecha, clase, precio unitario) y total.
3. El sistema genera un ticket electrónico por cada pasaje con código de
reserva, datos del pasajero, número de vuelo, origen, destino, fecha, horario y
clase.
4. El sistema guarda los documentos asociados a la compra y deja los tickets
en estado "Emitido".
5. El sistema muestra la pantalla de confirmación con el mensaje "Compra
realizada correctamente" y el acceso a la factura y a los tickets.
6. El pasajero puede volver a consultarlos desde la sección "Mis compras".

Caminos alternativos

1. Error al generar los documentos.

a. Ocurre un error al generar la factura o algún ticket luego de un pago
exitoso.
b. El sistema conserva el pago registrado, marca la compra con
documentación "Pendiente", reintenta la generación y muestra el mensaje
"Su compra fue registrada. La documentación estará disponible en breve en
Mis compras".
2. Pago no exitoso.

a. El pago de la reserva fue rechazado o cancelado.
b. El sistema no emite factura ni tickets.
3. Acceso a documentos de otro pasajero.

a. Un pasajero intenta acceder, por ejemplo mediante la URL, a la factura o
a un ticket de otra compra.

b. El sistema rechaza el acceso y muestra el mensaje "No tiene permisos
para acceder a esta sección".

4. Error de conexión con la base de datos.

a. Ocurre un error de comunicación al guardar los documentos.
b. El sistema informa que no se pudo registrar la documentación y sugiere
contactar al equipo técnico.

Wireframe asociado: wireframe_confirmacion_compra.png y
wireframe_mis_compras.png.
Nota: Según el RF19, depende de la gestión de pagos (RF18, US-26). Esta story
es necesaria para poder probar la cancelación de vuelo (US-19) y la consulta de
reservas (US-20) del Sprint 2. Los documentos se generan en PDF. La descarga
desde la App móvil (RF20) y el envío por email (RF26) tienen otra prioridad y no
se incluyen en esta story.

 Reportes de ocupación

ID: US-28

Prioridad: Alta

Estimación: 6 hs  Sprint: 3

Alumno asignado: Alumno 4

Historia de Usuario
Como administrador del sistema, necesito poder generar y visualizar reportes del
nivel de ocupación de los vuelos filtrando por vuelo, clase y fecha
con la finalidad de tomar decisiones operativas y comerciales con información
precisa y centralizada.

Criterio de aceptación
Dado que soy administrador autenticado y estoy en la pantalla de reportes de
ocupación,
Cuando selecciono los filtros de vuelo, clase y rango de fechas y presiono
"Generar reporte",
Entonces el sistema muestra, para cada viaje, la capacidad, los pasajes
vendidos, los asientos libres y el porcentaje de ocupación, coincidiendo con los
pasajes registrados en la base de datos.

Descripción más detallada
Camino de éxito

1. El administrador accede a la pantalla de reportes de ocupación.
2. Selecciona el vuelo (o "Todos"), la clase (Economy, Primera o ambas) y el
rango de fechas.
3. Presiona "Generar reporte".
4. El sistema calcula la ocupación de cada viaje a partir de los pasajes pagados
y no cancelados y de la capacidad por clase del avión asignado.

5. El sistema muestra una tabla con fecha, vuelo, clase, capacidad, pasajes
vendidos, asientos libres y porcentaje de ocupación, junto con el promedio de
ocupación del período.

Caminos alternativos

1. Sin datos para los filtros.

a. No hay viajes que coincidan con los filtros seleccionados.
b. El sistema muestra el mensaje "No hay datos de ocupación para los filtros
seleccionados".

2. Rango de fechas inválido.

a. El administrador ingresa una fecha "desde" posterior a la fecha "hasta" o
deja el rango vacío.
b. El sistema marca en rojo los campos con error y no habilita la generación
del reporte.

3. Vuelos cancelados en el período.

a. Alguno de los viajes del período fue cancelado por el administrador.
b. El sistema lo muestra en el reporte con el estado "Cancelado" y no lo
considera en el promedio de ocupación.

4. Usuario sin rol de administrador.

a. Un usuario que no es administrador intenta acceder a la pantalla de
reportes de ocupación.
b. El sistema rechaza el acceso y muestra el mensaje "No tiene permisos
para acceder a esta sección".

5. Error de conexión con la base de datos.

a. Ocurre un error de comunicación al consultar.
b. El sistema informa que no pudo generar el reporte y sugiere reintentar
más tarde.

Wireframe asociado: wireframe_reportes_ocupacion.png.
Nota: Según el RF28, depende del alta de aviones (RF09), del alta de vuelos
(RF12) y de la gestión de pagos (RF18, US-26). Solo cuentan como vendidos los
pasajes pagados; los pasajes cancelados por el pasajero (US-19) liberan el
asiento y no suman a la ocupación. El POS fija como objetivo un 100% de
precisión en la ocupación.

 Adaptación responsive de la plataforma web

ID: US-29

Prioridad: Alta

Estimación: 10
hs

Sprint: 3

Alumno asignado: Alumno 5

Historia de Usuario

Como usuario del sistema (pasajero, empleado de mostrador o administrador),
necesito que la plataforma web se adapte correctamente al tamaño de la pantalla
del dispositivo que estoy usando (celular, tablet o computadora)
con la finalidad de poder utilizar todas las funciones cómodamente desde
cualquier dispositivo, sin tener que hacer zoom ni desplazarme horizontalmente
por la página.

Criterio de aceptación
Dado que accedo a la plataforma web desde un celular (ancho de pantalla menor
a 768 px),
Cuando navego por cualquier pantalla del sistema,
Entonces el contenido se muestra en una sola columna, el menú se reemplaza
por un menú desplegable (ícono de hamburguesa) y no aparece desplazamiento
horizontal en la página.
Dado que accedo desde una tablet (entre 768 px y 1024 px) o una computadora
(más de 1024 px),
Cuando navego por cualquier pantalla del sistema,
Entonces la distribución del contenido se ajusta al ancho disponible manteniendo
todas las funcionalidades.
Dado que estoy en una pantalla con tablas extensas (gestión de usuarios,
aviones, vuelos o reportes) desde un celular,
Cuando visualizo la tabla,
Entonces la tabla se desplaza horizontalmente dentro de su propio contenedor,
sin deformar el resto de la página.

Descripción más detallada
Camino de éxito

1. El usuario accede a la plataforma web desde su celular.
2. El sistema detecta el ancho de la pantalla y aplica el diseño para dispositivos
móviles.
3. El usuario ve el menú de navegación agrupado en el ícono de hamburguesa
y lo despliega para moverse entre secciones.
4. Los formularios (registro, login, búsqueda de vuelos, reserva, pago) ocupan
todo el ancho, con campos y botones de un tamaño cómodo para usar con el
dedo.
5. El usuario completa la tarea (por ejemplo, buscar y reservar un vuelo) sin
hacer zoom ni desplazarse horizontalmente.

Caminos alternativos

1. Cambio de orientación del dispositivo.

a. El usuario gira el celular o la tablet de vertical a horizontal (o al revés).
b. El sistema reacomoda el contenido al nuevo ancho sin recargar la página
ni perder los datos ingresados.

2. Pantallas muy pequeñas.

a. El usuario accede desde un dispositivo de 320 px de ancho.

b. El contenido sigue siendo legible, los textos no se superponen y todos los
botones quedan accesibles.

3. Ventana de escritorio redimensionada.

a. El usuario achica la ventana del navegador en una computadora.
b. El sistema aplica progresivamente el diseño de tablet y luego el de celular
según el ancho disponible.

4. Tablas o reportes con muchas columnas.

a. El usuario abre desde el celular una pantalla de gestión o el reporte de
ocupación.
b. La tabla se desplaza horizontalmente dentro de su contenedor (o se
muestra en formato de tarjetas) y el resto de la página no se deforma.

Wireframe asociado: Versiones móvil (360 px), tablet (768 px) y escritorio (1280
px) de las pantallas principales: login, búsqueda de vuelos, reserva, pago, gestión
de usuarios y reportes.
Nota: No tiene un RF asociado: es un requisito de presentación transversal a
todas las pantallas web ya desarrolladas en los Sprints 1 y 2 y a las de este sprint.
Se relaciona con el RNF05 (Experiencia visual unificada), por lo que debe
respetar la guía de estilos del proyecto. No reemplaza a la App móvil, que se
desarrolla en el Sprint 4. Se recomienda un enfoque mobile-first con media
queries en los breakpoints de 768 px y 1024 px, y verificar con las herramientas
de emulación de dispositivos del navegador.

Correccion: Eliminación de restricción horaria para cancelación y
modificación de vuelos

ID: US-30

Prioridad: Alta

Estimación: 3 hs   Sprint: 3

Alumno asignado: Alumno 5

Historia de Usuario
Como administrador, necesito poder cancelar o modificar un vuelo en cualquier
momento previo a su partida, sin importar cuántas horas falten para que
despegue,con la finalidad de tener total flexibilidad para gestionar mis reservas
ante cambios de último momento y cumplir con las reglas de negocio establecidas
por el cliente.

Criterio de aceptación
Dado que tengo un pasaje comprado para un vuelo que aún no ha partido
(incluso si faltan 3 horas o menos para el despegue),Cuando selecciono el vuelo,
presiono "Cancelar" (o Modificar) y confirmo la acción, Entonces el sistema
procesa la solicitud exitosamente, cancelando o modificando las reservas sin
arrojar errores de restricción de tiempo, y libera el asiento si corresponde.

Descripción más detallada

Camino de éxito

1. El usuario administrador accede a la pantalla de vuelos.
2. El sistema detecta el ancho de la pantalla y aplica el diseño para dispositivos
móviles.
3. Selecciona un vuelo que está a punto de salir (ej. faltan 45 minutos para el
despegue).
4. Presiona "Cancelar" o “Editar”.
5. El sistema solicita confirmación.
6. El usuario confirma.
7. El sistema omite cualquier validación de horas previas, cambia el estado de
la reserva/vuelo y muestra un mensaje de éxito ("Pasaje cancelado/modificado
correctamente").
Caminos alternativos
Intento de cancelación de un vuelo que ya partió.

a. El usuario intenta cancelar un vuelo cuyo horario de salida ya se cumplió (el
vuelo está "en curso" o "finalizado").

b. El sistema no permite la acción y muestra el mensaje: "No es posible cancelar
o modificar un vuelo que ya ha partido."

Error de conexión con la base de datos.

a. Ocurre un error de comunicación al guardar los cambios.

b. El sistema informa que no se pudo completar la operación y sugiere reintentar
o contactar al equipo técnico.

Wireframe asociado: No requiere un nuevo wireframe. Se reutilizan las
interfaces existentes de cancelación (ej. wireframe_cancelar_pasaje.png) y
modificación de vuelos.

