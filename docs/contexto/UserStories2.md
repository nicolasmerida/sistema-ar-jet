User Stories

Título: Registro de pasajeros

ID: US-12

Prioridad: Alta

Estimación: 4 hs  Sprint: 2

Alumno asignado: Alumno 1

Historia de Usuario
Como pasajero, necesito poder crear una cuenta ingresando mi email, nombre,
apellido, documento y contraseña
con la finalidad de identificarse en el sistema y comprar pasajes de forma
autónoma.

Criterio de aceptación
Dado que soy un visitante sin cuenta y estoy en la pantalla de registro,
Cuando completo el formulario con datos válidos y presiono "Registrarse",
Entonces el sistema crea mi cuenta con rol Pasajero y puedo iniciar sesión con
mis credenciales.

Descripción más detallada
Camino de éxito

1. El visitante accede a la pantalla de registro.
2. Completa email, nombre, apellido, documento y contraseña.
3. Presiona "Registrarse".
4. El sistema guarda la cuenta y muestra el mensaje "Cuenta creada
correctamente".

Caminos alternativos

1. Campos obligatorios incompletos.

a. El visitante deja sin completar algún campo obligatorio.
b. El sistema marca en rojo los campos faltantes y no habilita el registro.

2. Email ya registrado.

a. El visitante ingresa un email que ya tiene una cuenta.
b. El sistema muestra el mensaje "Ya existe una cuenta con ese email" y no
guarda.

3. Datos con formato inválido.

a. El visitante ingresa un email o documento con formato inválido.
b. El sistema muestra el error debajo del campo y no guarda.

4. Error de conexión con la base de datos.

a. Ocurre un error de comunicación al guardar.
b. El sistema informa que no se pudieron guardar los datos y sugiere
contactar al equipo técnico.

Wireframe asociado: wireframe_registro.png.
Nota: Según el RF01, no tiene dependencias. La App móvil se desarrolla recién
en el Sprint 4: el Sprint 2 prioriza la página web.

Título: Autenticación y autorización (Login)

ID: US-13

Prioridad: Alta

Estimación: 6 hs  Sprint: 2

Alumno asignado: Alumno 2

Historia de Usuario
Como usuario del sistema (pasajero, empleado de mostrador o administrador),
necesito poder iniciar sesión con mis credenciales
con la finalidad de acceder a la interfaz y a las funciones que corresponden a mi
rol.

Criterio de aceptación
Dado que tengo una cuenta activa y estoy en la pantalla de inicio de sesión,
Cuando ingreso mi email y contraseña correctos y presiono "Ingresar",
Entonces el sistema me redirige a la interfaz de mi rol y no me permite acceder a
las de otros roles.

Descripción más detallada
Camino de éxito

1. El usuario accede a la pantalla de inicio de sesión.
2. Ingresa su email y contraseña.
3. Presiona "Ingresar".
4. El sistema valida las credenciales y el rol del usuario.
5. El sistema lo redirige a su interfaz: gestión para el administrador, mostrador
para el empleado y búsqueda de vuelos para el pasajero.

Caminos alternativos

1. Credenciales incorrectas.

a. El usuario ingresa un email o una contraseña incorrectos.
b. El sistema muestra el mensaje "Email o contraseña incorrectos" sin
indicar cuál de los dos falló.

2. Campos incompletos.

a. El usuario deja el email o la contraseña vacíos.
b. El sistema marca en rojo los campos faltantes y no habilita el ingreso.

3. Acceso a la interfaz de otro rol.

a. Un usuario autenticado intenta acceder, por ejemplo mediante la URL, a
una interfaz que no corresponde a su rol.
b. El sistema rechaza el acceso y muestra el mensaje "No tiene permisos
para acceder a esta sección".

4. Usuario dado de baja.

a. El usuario ingresa credenciales de una cuenta dada de baja.
b. El sistema no permite el ingreso y muestra el mensaje "La cuenta no está
habilitada".

5. Error de conexión con la base de datos.

a. Ocurre un error de comunicación al validar las credenciales.
b. El sistema informa que no pudo iniciar la sesión y sugiere reintentar más
tarde.

Wireframe asociado: wireframe_login.png.
Nota: Según el RF02, depende del registro de pasajeros (RF01, US-12) y del alta
de usuarios (RF03, US-14).

Título: Alta de usuarios

ID: US-14

Prioridad: Alta

Estimación: 4 hs  Sprint: 2

Alumno asignado: Alumno 3

Historia de Usuario
Como administrador del sistema,
necesito poder dar de alta empleados, administradores y clientes asignándoles el
rol correspondiente
con la finalidad de controlar quién accede a las funciones operativas y
administrativas.

Criterio de aceptación
Dado que soy administrador autenticado y estoy en la pantalla de gestión de
usuarios,
Cuando presiono "Nuevo usuario", completo el formulario con datos y rol válidos
y presiono "Guardar",
 Entonces el sistema registra el usuario con el rol asignado y este puede iniciar
sesión.

Descripción más detallada
Camino de éxito

1. El administrador accede a la pantalla de gestión de usuarios y presiona
"Nuevo usuario".
2. Completa email, nombre, apellido, documento y contraseña inicial.
3. Selecciona el rol: Administrador, Empleado de mostrador o Pasajero.
4. Presiona "Guardar".
5. El sistema guarda el usuario y muestra el mensaje "Usuario creado
correctamente".

Caminos alternativos

1. Campos obligatorios incompletos.

a. El administrador deja sin completar algún campo obligatorio o no
selecciona un rol.
b. El sistema marca en rojo los campos faltantes y no habilita el guardado.

2. Datos duplicados.

a. El administrador ingresa un email o documento ya registrado.
b. El sistema muestra el mensaje "Ya existe un usuario con ese email o
documento" y no guarda.

3. Usuario sin rol de administrador.

a. Un usuario que no es administrador intenta acceder a la pantalla de
gestión de usuarios.
b. El sistema rechaza el acceso y muestra el mensaje "No tiene permisos
para acceder a esta sección".

4. Error de conexión con la base de datos.

a. Ocurre un error de comunicación al guardar.
b. El sistema informa que no se pudieron guardar los datos y sugiere
contactar al equipo técnico.

Wireframe asociado: wireframe_abm_usuarios.png.
Nota: Según el RF03, depende del login (RF02, US-13).

Título: Baja de usuarios

ID: US-15

Prioridad: Alta

Estimación: 3 hs  Sprint: 2

Alumno asignado: Alumno 4

Historia de Usuario
Como administrador del sistema,
necesito poder dar de baja empleados, administradores y clientes
con la finalidad de revocar el acceso de quienes ya no deben operar en el
sistema y resguardar la seguridad de los datos.

Criterio de aceptación
Dado que soy administrador autenticado y el usuario existe y está activo,
Cuando selecciono el usuario, presiono "Dar de baja" y confirmo,
Entonces el sistema lo da de baja y ese usuario ya no puede iniciar sesión.

Descripción más detallada
Camino de éxito

1. El administrador accede a la pantalla de gestión de usuarios.
2. Selecciona el usuario y presiona "Dar de baja".
3. El sistema muestra un popup pidiendo confirmación.
4. El administrador confirma.
5. El sistema da de baja al usuario y muestra el mensaje "Usuario dado de baja
correctamente".

Caminos alternativos

1. El administrador no confirma.

a. El administrador presiona "No" en el popup de confirmación.
b. El sistema no da de baja al usuario y lo deja en la pantalla de gestión.

2. Usuario sin rol de administrador.

a. Un usuario que no es administrador intenta acceder a la pantalla de
gestión de usuarios.
b. El sistema rechaza el acceso y muestra el mensaje "No tiene permisos
para acceder a esta sección".

3. Error de conexión con la base de datos.

a. Ocurre un error de comunicación al guardar.
b. El sistema informa que no se pudo completar la baja y sugiere contactar
al equipo técnico.

Wireframe asociado: wireframe_abm_usuarios.png.
Nota: Según el RF04, depende del login (RF02, US-13) y del alta de usuarios
(RF03, US-14).

Título: Modificación de usuarios

ID: US-16

Prioridad: Alta

Estimación: 4 hs  Sprint: 2

Alumno asignado: Alumno 5

Historia de Usuario
Como administrador del sistema,
necesito poder modificar los datos y el rol de empleados, administradores y
clientes
con la finalidad de mantener actualizada su información y controlar qué
funciones puede utilizar cada uno, por ejemplo ante un cambio de rol.

Criterio de aceptación
Dado que soy administrador autenticado y el usuario existe,
Cuando selecciono el usuario, presiono "Editar", modifico sus datos o su rol y
presiono "Guardar",
Entonces el sistema guarda los cambios y los refleja en los permisos del usuario.

Descripción más detallada
Camino de éxito

1. El administrador accede a la pantalla de gestión de usuarios.
2. Selecciona el usuario y presiona "Editar".
3. Modifica los datos deseados o cambia el rol.
4. Presiona "Guardar".
5. El sistema guarda los cambios y muestra el mensaje "Usuario actualizado
correctamente".

Caminos alternativos

1. Campos obligatorios incompletos.

a. El administrador borra algún campo obligatorio.
b. El sistema marca en rojo el campo y no habilita el guardado.

2. Datos duplicados.

a. El administrador cambia el email o el documento por uno ya registrado.
b. El sistema muestra el mensaje "Ya existe un usuario con ese email o
documento" y no guarda.

3. Usuario sin rol de administrador.

a. Un usuario que no es administrador intenta acceder a la pantalla de
gestión de usuarios.
b. El sistema rechaza el acceso y muestra el mensaje "No tiene permisos
para acceder a esta sección".

4. Error de conexión con la base de datos.

a. Ocurre un error de comunicación al guardar.
b. El sistema informa que no se pudieron guardar los datos y sugiere
contactar al equipo técnico.

Wireframe asociado: wireframe_abm_usuarios.png.
Nota: Según el RF05, depende del login (RF02, US-13) y del alta de usuarios
(RF03, US-14).

Título: Búsqueda de vuelos

ID: US-17

Prioridad: Alta

Estimación: 4 hs  Sprint: 2

Alumno asignado: Alumno 6

Historia de Usuario
Como pasajero,
necesito poder buscar vuelos ingresando origen, destino y fecha
con la finalidad de ver las opciones disponibles para comprar mi pasaje.

Criterio de aceptación
Dado que estoy en la pantalla de búsqueda de vuelos,
Cuando selecciono origen, destino y fecha y presiono "Buscar",
Entonces el sistema muestra solo los vuelos que operan ese día, dentro de su
período de vigencia, que no están cancelados y que tienen asientos libres.

Descripción más detallada
Camino de éxito

1. El pasajero accede a la pantalla de búsqueda de vuelos.
2. Selecciona el aeropuerto de origen y el de destino de la lista cargada.
3. Selecciona la fecha.
4. Presiona "Buscar".

5. El sistema muestra la lista de vuelos con número de vuelo, horarios, precio
por clase y asientos disponibles.

Caminos alternativos

1. Origen y destino iguales.

a. El pasajero selecciona el mismo aeropuerto como origen y destino.
b. El sistema no realiza la búsqueda y muestra el mensaje "El origen y el
destino deben ser distintos".

2. Campos incompletos.

a. El pasajero deja sin completar el origen, el destino o la fecha.
b. El sistema marca en rojo los campos faltantes y no habilita la búsqueda.

3. Fecha pasada.

a. El pasajero selecciona una fecha anterior a la actual.
b. El sistema muestra el mensaje correspondiente debajo del campo y no
busca.

4. Sin resultados.

a. No hay vuelos que cumplan la búsqueda (fuera de período, cancelados o
sin asientos).
b. El sistema muestra el mensaje "No hay vuelos disponibles para la
búsqueda realizada".

5. Error de conexión con la base de datos.

a. Ocurre un error de comunicación al consultar.
b. El sistema informa que no pudo realizar la búsqueda y sugiere reintentar
más tarde.

Wireframe asociado: wireframe_busqueda_vuelos.png.
Nota: Según el RF15, depende del alta de vuelos (RF12, US-06). Todos los
vuelos son directos, sin escalas.

Título: Selección y reserva

ID: US-18

Prioridad: Alta

Estimación: 8 hs  Sprint: 2

Alumno asignado: Alumno 7

Historia de Usuario
Como pasajero,
necesito poder seleccionar un vuelo y la clase deseada (Economy o Primera)
con la finalidad de elegir la opción que quiero adquirir antes de realizar el pago.

Criterio de aceptación
Dado que soy un pasajero autenticado y el vuelo tiene asientos libres en la clase
elegida,
Cuando selecciono el vuelo, elijo la clase y presiono "Reservar",

Entonces el sistema registra mi selección verificando la disponibilidad de esa
clase en ese momento y me permite continuar con la compra.

Descripción más detallada
Camino de éxito

1. El pasajero busca vuelos y los resultados aparecen en pantalla.
2. Selecciona un vuelo.
3. Elige la clase: Economy o Primera.
4. Presiona "Reservar".
5. El sistema verifica que haya asientos libres en la clase, registra la selección y
muestra el resumen para continuar.

Caminos alternativos

1. Clase sin asientos disponibles.

a. El pasajero intenta elegir una clase sin asientos libres.
b. El sistema deshabilita la opción y muestra el mensaje "No hay asientos
disponibles en esta clase".

2. Último asiento tomado por otro pasajero.

a. Dos pasajeros reservan al mismo tiempo el último asiento de una clase.
b. Al segundo el sistema le muestra el mensaje "El asiento ya no está
disponible", sin sobrevender, y lo devuelve a los resultados.

3. Pasajero no autenticado.

a. Un visitante intenta reservar sin haber iniciado sesión.
b. El sistema lo redirige a la pantalla de login y conserva su selección.

4. Error de conexión con la base de datos.

a. Ocurre un error de comunicación al reservar.
b. El sistema informa que no se pudo registrar la reserva y sugiere reintentar
más tarde.

Wireframe asociado: wireframe_seleccion_reserva.png.
Nota: Según el RF16, depende del registro de pasajeros (RF01, US-12) y de la
búsqueda de vuelos (RF15, US-17). El límite de 9 pasajes (RF17) y el pago
(RF18) tienen otra prioridad y no se incluyen en esta story.

Título: Cancelación de vuelo comprado por el pasajero

ID: US-19

Prioridad: Alta

Estimación: 6 hs  Sprint: 2

Alumno asignado: Alumno 8

Historia de Usuario
Como pasajero,
necesito poder cancelar un vuelo que compré hasta un día antes de la fecha de
partida

con la finalidad de dar de baja mi compra ante un cambio de planes y que la
aerolínea pueda reasignar el asiento.

Criterio de aceptación
Dado que soy un pasajero autenticado, tengo un pasaje comprado y falta un día o
más para la fecha de partida,
Cuando selecciono el pasaje, presiono "Cancelar pasaje" y confirmo,
Entonces el sistema marca el pasaje como cancelado y libera el asiento para que
vuelva a estar disponible para la venta.

Descripción más detallada
Camino de éxito

1. El pasajero accede a la sección de sus compras.
2. Selecciona el pasaje y presiona "Cancelar pasaje".
3. El sistema muestra un popup pidiendo confirmación.
4. El pasajero confirma.
5. El sistema cambia el estado del pasaje a "Cancelado", libera el asiento de
esa clase y muestra el mensaje "Pasaje cancelado correctamente".

Caminos alternativos

1. Cancelación fuera de plazo.

a. Falta menos de un día para la fecha de partida.
b. El sistema no permite la cancelación y muestra el mensaje "No es posible
cancelar un pasaje con menos de un día de anticipación".

2. El pasajero no confirma.

a. El pasajero presiona "No" en el popup de confirmación.
b. El sistema no cancela el pasaje y lo deja en la pantalla de sus compras.

3. Pasaje ya cancelado.

a. El pasajero selecciona un pasaje que ya está cancelado.
b. El botón "Cancelar pasaje" no está disponible para ese pasaje.

4. Error de conexión con la base de datos.

a. Ocurre un error de comunicación al guardar.
b. El sistema informa que no se pudo completar la cancelación y sugiere
contactar al equipo técnico.

Wireframe asociado: wireframe_cancelar_pasaje.png.
Nota: Según el RF21, depende de la selección y reserva (RF16, US-18) y de la
emisión de pasajes (RF19), que tiene otra prioridad y debe estar disponible para
poder probar esta story.

Título: Consulta de reservas

ID: US-20

Prioridad: Alta

Estimación: 5 hs  Sprint: 2

Alumno asignado: Alumno 9

Historia de Usuario
Como empleado de mostrador,
necesito poder buscar a un pasajero y sus vuelos por DNI, nombre y apellido o
código de reserva
con la finalidad de acceder rápidamente a su información para asistirlo.

Criterio de aceptación
Dado que soy un empleado autenticado y estoy en la pantalla de consulta de
reservas,
Cuando elijo el criterio de búsqueda, ingreso el valor y presiono "Buscar",
Entonces el sistema muestra los datos del pasajero y sus vuelos reservados.

Descripción más detallada
Camino de éxito

1. El empleado accede a la pantalla de consulta de reservas.
2. Elige el criterio: DNI, nombre y apellido o código de reserva.
3. Ingresa el valor a buscar.
4. Presiona "Buscar".
5. El sistema muestra el pasajero y sus vuelos con el estado de cada pasaje.

Caminos alternativos
1. Sin resultados.

a. El empleado ingresa un dato que no existe en el sistema.
b. El sistema muestra el mensaje "No se encontraron reservas para los
datos ingresados".

2. Campo de búsqueda vacío.

a. El empleado presiona "Buscar" sin ingresar ningún valor.
b. El sistema marca el campo en rojo y no realiza la búsqueda.

3. Usuario sin rol de empleado.

a. Un usuario que no es empleado intenta acceder a la pantalla de consulta
de reservas.
b. El sistema rechaza el acceso y muestra el mensaje "No tiene permisos
para acceder a esta sección".

4. Error de conexión con la base de datos.

a. Ocurre un error de comunicación al consultar.
b. El sistema informa que no pudo realizar la búsqueda y sugiere reintentar
más tarde.

Wireframe asociado: wireframe_consulta_reservas.png.
Nota: Según el RF22, depende del login (RF02, US-13) y de la emisión de
pasajes (RF19), que tiene otra prioridad.

Título: Asistencia de check-in

ID: US-21

Prioridad: Alta

Estimación: 5 hs  Sprint: 2

Alumno asignado: Alumno 10

Historia de Usuario
Como empleado de mostrador,
necesito poder marcar la presentación del pasajero y validar su ticket
con la finalidad de registrar quién se presentó en el aeropuerto y verificar que su
pasaje sea válido.

Criterio de aceptación
Dado que soy un empleado autenticado y el ticket del pasajero es válido,
corresponde a un vuelo no cancelado y no tiene check-in previo,
Cuando busco al pasajero y presiono "Registrar check-in",
Entonces el sistema marca el ticket como presentado.

Descripción más detallada
Camino de éxito

1. El empleado busca al pasajero desde la consulta de reservas.
2. Selecciona el pasaje del vuelo correspondiente.
3. El sistema valida el ticket.
4. El empleado presiona "Registrar check-in".
5. El sistema cambia el estado del ticket a "Presentado" y muestra el mensaje
"Check-in registrado correctamente".

Caminos alternativos
1. Ticket inválido.

a. El ticket no existe, está cancelado o no corresponde al pasajero.
b. El sistema rechaza el check-in y muestra el mensaje "El ticket no es
válido".

2. Vuelo cancelado.

a. El pasaje corresponde a un vuelo cancelado.
b. El sistema rechaza el check-in y muestra el mensaje "El vuelo fue
cancelado".

3. Pasajero ya presentado.

a. El ticket ya tiene un check-in registrado.
b. El sistema rechaza el check-in y muestra el mensaje "El pasajero ya
realizó el check-in".

4. Error de conexión con la base de datos.

a. Ocurre un error de comunicación al guardar.
b. El sistema informa que no se pudo registrar el check-in y sugiere
reintentar más tarde.

Wireframe asociado: wireframe_checkin.png.

Nota: Según el RF24, depende de la consulta de reservas (RF22, US-20).

Título: Consulta de estado de vuelos

ID: US-22

Prioridad: Alta

Estimación: 2 hs  Sprint: 2

Alumno asignado: Alumno 1

Historia de Usuario
Como empleado de mostrador,
necesito poder ver en tiempo real los distintos estados de los vuelos
con la finalidad de informar a los pasajeros sobre demoras, cambios de horario o
cancelaciones sin depender de otras áreas.

Criterio de aceptación
Dado que soy un empleado autenticado y estoy en la pantalla de estado de
vuelos,
Cuando accedo a la pantalla o aplico un filtro,
Entonces el sistema muestra los vuelos con su estado actual (programado,
demorado, cancelado o en curso), reflejando de inmediato las modificaciones y
cancelaciones hechas por el administrador.

Descripción más detallada
Camino de éxito

1. El empleado accede a la pantalla de estado de vuelos.
2. El sistema muestra la lista de vuelos con su horario y su estado actual.
3. El empleado filtra por fecha, origen o destino si lo necesita.
4. El sistema actualiza la lista con el resultado del filtro.

Caminos alternativos

1. Sin vuelos para el filtro.

a. El empleado aplica un filtro sin vuelos coincidentes.
b. El sistema muestra el mensaje "No hay vuelos para los filtros
seleccionados".

2. Vuelo modificado o cancelado por el administrador.

a. El administrador modifica el horario de un vuelo o lo cancela.
b. La consulta muestra de inmediato el nuevo horario o el estado
"Cancelado".

3. Usuario sin rol de empleado.

a. Un usuario que no es empleado intenta acceder a la pantalla de estado
de vuelos.
b. El sistema rechaza el acceso y muestra el mensaje "No tiene permisos
para acceder a esta sección".

4. Error de conexión con la base de datos.

a. Ocurre un error de comunicación al consultar.
b. El sistema informa que no pudo cargar los vuelos y sugiere reintentar más
tar  de.

Wireframe asociado: wireframe_estado_vuelos.png.
Nota: Según el RF25, depende del alta, la modificación y la cancelación de
vuelos (RF12, RF13 y RF14, US-06 a US-08).

Título: Corrección de validación de horarios en vuelos con llegada al día
siguiente

ID: US-23

Prioridad: Alta

Estimación: 5 hs  Sprint: 2

Alumno asignado: Alumno 7

Historia de Usuario

Como administrador del sistema, necesito ingresar el horario de salida y la
duración total del vuelo (en horas y minutos), para que el sistema calcule
automáticamente el horario de llegada y determine si corresponde al mismo día o
al día siguiente, con la finalidad de agilizar la carga de datos, evitar errores
humanos en el ingreso y eliminar los problemas de validación de horarios en
vuelos que atraviesan la medianoche.

Criterio de aceptación

Dado que estoy en la pantalla de creación de vuelos, Cuando ingreso un horario
de salida (ej. 23:00) y una duración de vuelo (ej. 2 horas), Entonces la interfaz
calcula automáticamente y muestra en un campo de solo lectura que el horario de
llegada es "01:00 (Llegada al día siguiente)".

Dado que ingreso un horario de salida (ej. 10:00) y una duración de vuelo (ej. 2
horas y 30 minutos), Cuando el frontend procesa los datos, Entonces muestra
que el horario de llegada es "12:30".

Dado que guardo el vuelo con los datos calculados, Cuando el sistema procesa
la solicitud, Entonces registra correctamente el vuelo, almacenando la hora de
salida, la duración, la hora calculada de llegada y el offset de día (si corresponde)
para generar correctamente los viajes futuros.

Descripción más detallada
Camino de éxito

1.  El administrador accede a la pantalla de gestión de vuelos y presiona

“Nuevo vuelo”.

2.  Completa el número de vuelo y selecciona los aeropuertos de origen y

destino.

3.  Ingresa el horario de salida: 23:00.
4.  Ingresa la duración del vuelo: 02:00 (2 horas).
5.  El frontend, suma la duración al horario de salida. Al superar las 24 horas
teóricas, aplica módulo 24, calcula la hora de llegada (01:00) y detecta el
cambio de día (+1).

6.  El sistema actualiza un texto o campo deshabilitado en pantalla mostrando:

"Hora de llegada estimada: 01:00 (Día siguiente)".

7.  Selecciona los días de operación, período de vigencia, el avión asignado y

los precios.

8.  Presiona “Guardar”.
9.  El backend valida la integridad de los datos, guarda el modelo del vuelo y
genera los viajes concretos en el calendario aplicando el offset de días
correspondiente a la fecha de llegada.

Caminos alternativos

1.  Cálculo dinámico ante modificaciones. 1.a. El administrador ingresa
salida 10:00 y duración 02:00. El sistema muestra llegada 12:00. 1.b. El
administrador modifica la salida a 23:00 (manteniendo la duración). 1.c. El
sistema recalcula dinámicamente y actualiza la llegada a 01:00 (Día
siguiente) antes de guardar.

2.  Campos obligatorios incompletos o inválidos. 2.a. El administrador deja

en blanco la hora de salida o la duración. 2.b. El campo de "Hora de
llegada" se muestra vacío o con guiones (ej. "--:--"). 2.c. El sistema marca
en rojo los campos faltantes y deshabilita el botón "Guardar".

3.  Valores de duración anómalos. 3.a. El administrador ingresa una
duración ilógica (ej. superior a 24 horas o un valor negativo). 3.b. El
sistema de validación del frontend bloquea el ingreso o muestra un
mensaje de error: "La duración debe ser un valor válido mayor a 0 y menor
a X horas".

Wireframe asociado: Reemplazar el campo input de "Hora de llegada" por un
input numérico o de tiempo de "Duración de vuelo (HH:MM)".
Añadir un elemento visual (texto enriquecido o input deshabilitado) a la derecha o
debajo que diga "Llegada calculada: [HH:MM] [+1 dia]".

Nota: Relacionado con: RF12 y US-06.
Cálculo de fechas (Frontend): Convertir la hora de salida a minutos desde la
medianoche ((HH * 60) + MM), sumar la duración en minutos. La nueva hora de
llegada será Math.floor((totalMinutos % 1440) / 60) y los minutos totalMinutos %
60. Si totalMinutos >= 1440, hay cambio de día (offset = 1).
Generación de Viajes: El script que materializa los vuelos en "Viajes" diarios debe
tomar la fecha base del viaje, aplicarle la hora_salida, y para la llegada, tomar la
fecha base, sumarle el arrival_day_offset (días) y setearle la hora_llegada.

Título: Corrección baja de aviones y aeropuertos

ID: US-24

Prioridad: Alta

Estimación: 8 hs  Sprint: 2

Alumno asignado: Alumno 5

Historia de Usuario

Como administrador del sistema, necesito poder dar de baja (mediante soft
delete) aviones y aeropuertos que tengan vuelos vigentes programados,
cancelando automáticamente dichos vuelos y notificando a los pasajeros, y
necesito tener la opción de visibilizar estas entidades dadas de baja en el mismo
listado principal con un distintivo visual, con la finalidad de retirar de la operatoria
activos o destinos sin perder la integridad referencial, asegurando la correcta
comunicación con los clientes afectados y manteniendo el control visual sobre el
historial de recursos eliminados.

Criterio de aceptación

Dado que soy un administrador y solicito eliminar un avión o aeropuerto con
vuelos vigentes, Cuando confirmo la acción, Entonces el sistema marca la
entidad como eliminada de forma lógica (soft delete), cambia el estado de todos
sus vuelos futuros a "Cancelado", y encola el envío de notificaciones a las
reservas afectadas.

Dado que accedo a la pantalla de aviones o aeropuertos, Cuando visualizo la
tabla principal, Entonces por defecto los elementos con baja lógica no se
muestran en el listado.

Dado que estoy visualizando el listado principal, Cuando activo la opción "Ver
eliminados", Entonces la tabla se actualiza mostrando también las entidades
dadas de baja, las cuales deben renderizarse con un estilo distintivo (por ejemplo,
texto/filas en color gris) y tener la etiqueta "(eliminado)" junto al nombre o
identificador.

Dado que visualizo una entidad eliminada en la tabla, Cuando accedo a su
detalle, Entonces puedo ver su historial de vuelos (pasados y cancelados).

Descripción más detallada
Camino de éxito

1.  El administrador accede a la pantalla de gestión de Aviones (o

Aeropuertos) y presiona el botón "Eliminar" sobre un registro que
tiene vuelos a futuro.

2.  El sistema realiza una consulta, detecta los vuelos vigentes e
intercepta la eliminación, mostrando un modal de advertencia:

"Atención: Esta entidad tiene [X] vuelos vigentes. Proceder con la
baja cancelará todos estos vuelos. ¿Desea continuar?".

3.  El administrador presiona "Confirmar Baja y Cancelar Vuelos".
4.  El sistema abre una transacción de base de datos (ACID) y ejecuta:
5.  Una actualización en la entidad seteando su borrado lógico (ej.

deleted_at = NOW()).

6.  Un UPDATE masivo cambiando a "Cancelado" todos los vuelos
asociados con fecha/hora de salida mayor o igual a la actual.
7.  El sistema confirma la transacción (Commit) y dispara un evento

asíncrono para notificar a los pasajeros de los vuelos cancelados.

8.  El sistema muestra un mensaje flotante: "Entidad eliminada

correctamente. Los vuelos asociados han sido cancelados y los
pasajeros serán notificados."

9.  La pantalla se actualiza y la entidad desaparece de la tabla principal
(ya que el filtro "Ver eliminados" está desactivado por defecto).

Caminos alternativos

1.  Baja de entidad sin vuelos vigentes. 1.a. El administrador presiona
"Eliminar" sobre una entidad sin vuelos futuros programados. 1.b. El
sistema muestra un modal de confirmación estándar. 1.c. Al confirmar, el
sistema realiza el soft delete de la entidad.

2.  Uso del filtro "Ver eliminados". 2.a. El administrador marca la

casilla/interruptor "Ver eliminados" ubicada sobre la tabla. 2.b. El frontend
envía una petición al backend solicitando todos los registros (o bien elimina
el filtro deleted_at IS NULL de la consulta). 2.c. El sistema renderiza la
tabla. Las entidades activas se ven de forma normal; las dadas de baja se
muestran con estilo deshabilitado (gris) y concatenan el texto "(eliminado)"
en su columna descriptiva principal (Nombre o Matrícula). 2.d. Las
acciones de modificación (Editar, Eliminar) sobre la fila de una entidad
eliminada aparecen bloqueadas, permitiendo solo la opción de "Ver detalle
/ Historial".

3.  Error transaccional al cancelar. 3.a. Ocurre un error de base de datos
durante la actualización masiva de los vuelos. 3.b. El sistema realiza un
Rollback automático. 3.c. El sistema notifica el error y no aplica ningún
cambio.

Wireframe asociado: Incorporar un checkbox o interruptor (toggle) en la barra de
herramientas superior de la tabla con el label "Ver eliminados"
Se debe definir una clase CSS específica (ej. .row-deleted { color: #888;
text-decoration: none; }) para aplicar condicionalmente a las filas del Datatable si
el flag is_deleted (o deleted_at) tiene un valor verdadero.
Nota: Soft Delete: Se debe mantener la integridad referencial. Las claves
foráneas no deben usar CASCADE en eliminaciones físicas.
Filtros en el Backend: El endpoint GET /aviones (o aeropuertos) debería aceptar
un query param como ?include_deleted=true. Si no se envía o es falso, la
consulta a la base de datos debe inyectar por defecto un WHERE deleted_at IS
NULL.

UI Condicional: En el frontend, al mapear los datos a la grilla, se debe evaluar el
estado lógico de la entidad. Si está eliminada, deshabilitar acciones mutables e
inyectar el sufijo "(eliminado)".

