Título: Revisión de documentación

ID: US-00

Prioridad: Alta

Estimación: 3 hs

Sprint: 1

Alumno asignado: Alumno 1

Historia de Usuario
Cómo equipo de desarrollo,
necesitamos revisar la documentación del proyecto
con la finalidad de asegurar que las User Stories sean consistentes con los
requerimientos y el POS.

Criterio de aceptación
Dado que existen las planillas de requerimientos, el POS y las User Stories,
Cuando se completa la revisión,
Entonces cada User Story tiene su requerimiento asociado y las inconsistencias
quedan registradas y corregidas.

Descripción más detallada
Camino de éxito
1.Se revisan las User Stories contra la planilla de requerimientos funcionales.
2.Se revisan los requerimientos no funcionales y el POS.
3.Se registran las inconsistencias encontradas.
4.Se corrigen los documentos afectados.
Caminos alternativos
1.Inconsistencia entre documentos.

a.Se detecta una diferencia entre un requerimiento y una User Story.
b.Se registra y se define en equipo qué documento se corrige.

Wireframe asociado: No aplica.

Título: Creación de la base de datos

ID: US-01

Prioridad: Alta

Estimación: 2 hs

Sprint: 1

Alumno asignado: Alumno 10

Historia de Usuario
Cómo equipo de desarrollo,
necesitamos crear la base de datos del sistema con sus tablas y relaciones

con la finalidad de que las funcionalidades puedan guardar y consultar la
información de aeropuertos, aviones, vuelos y usuarios.

Criterio de aceptación
Dado que el modelo de datos del sistema está definido,
Cuando se ejecuta el script de creación de la base de datos,
Entonces la base queda creada con todas sus tablas, claves y restricciones, y
con los datos semilla cargados.

Descripción más detallada
Camino de éxito
1.Se definen las tablas a partir del modelo de datos.
2.Se definen las claves primarias, foráneas y restricciones.
3.Se escribe el script de creación y el de datos semilla.
4.Se ejecuta el script y se verifica que la base quede creada correctamente.
Caminos alternativos
1.Error al ejecutar el script.

a.El script falla por un error de sintaxis o de restricciones.
b.Se corrige el script y se vuelve a ejecutar sobre una base limpia.

Wireframe asociado: No aplica.

Título: Armado de pantallas (wireframes)

ID: US-02

Prioridad: Alta

Estimación:10 hs  Sprint: 1

Alumno asignado: Alumno 2

Historia de Usuario
Cómo equipo de desarrollo,
necesitamos armar los wireframes de las pantallas del sistema
con la finalidad de acordar la interfaz antes de implementarla.

Criterio de aceptación
Dado que las User Stories están definidas,
Cuando se completan los wireframes,
Entonces cada User Story tiene su pantalla asociada con los campos, botones y
mensajes que describe.

Descripción más detallada
Camino de éxito
1.Se listan las pantallas que requiere cada User Story.

2.Se arma el wireframe de cada pantalla.
3.Se revisan en equipo y se ajustan.
4.Se asocia cada wireframe a su User Story.
Caminos alternativos
1.Pantalla que no coincide con la User Story.

a.En la revisión se detecta que falta un campo o mensaje.
b.Se corrige el wireframe antes de darlo por terminado.

Wireframe asociado: wireframe_abm_aeropuertos.png,
wireframe_abm_aviones.png, wireframe_alta_vuelo.png,
wireframe_modificar_vuelo.png y wireframe_cancelar_vuelo.png

Título: Alta de aeropuertos

ID: US-03

Prioridad: Alta

Estimación:4

Sprint:1

Alumno asignado: Alumno 1

Historia de Usuario
Cómo administrador del sistema,
necesito poder dar de alta aeropuertos indicando su código, nombre y ciudad
con la finalidad de contar con los orígenes y destinos disponibles al momento de
crear vuelos.

Criterio de aceptación
Dado que soy administrador autenticado en el sistema y estoy en la pantalla de
gestión de aeropuertos,
Cuando presiono el botón "Nuevo aeropuerto", completo el formulario con datos
válidos y presiono "Guardar",
Entonces el sistema registra el aeropuerto y lo deja disponible como origen y
destino en la creación de vuelos.

Descripción más detallada
Camino de éxito
1.El administrador accede a la pantalla de gestión de aeropuertos y presiona

"Nuevo aeropuerto".

2.Completa el código, el nombre y la ciudad del aeropuerto.
3.Presiona "Guardar".
4.El sistema guarda el aeropuerto y muestra el mensaje "Aeropuerto creado

correctamente".
Caminos alternativos
1.Campos obligatorios incompletos.

a.El administrador deja sin completar algún campo obligatorio.
b.El sistema marca en rojo los campos faltantes y no habilita el guardado.

2.Aeropuerto duplicado.

a.El administrador ingresa un código de aeropuerto ya registrado.
b.El sistema muestra el mensaje "Ya existe un aeropuerto con ese código"

y no guarda.

3.Error de conexión con la base de datos.

a.Ocurre un error de comunicación al guardar.
b.El sistema informa que no se pudieron guardar los datos y sugiere

contactar al equipo técnico.

Wireframe asociado: wireframe_abm_aeropuertos.png

Título: Baja de aeropuertos

ID: US-04

Prioridad: Alta

Estimación:3

Sprint:1

Alumno asignado: Alumno 2

Historia de Usuario
Cómo administrador del sistema,
necesito poder eliminar los aeropuertos que ya no se utilicen
con la finalidad de mantener actualizado el listado de orígenes y destinos sin
comprometer los vuelos vigentes.

Criterio de aceptación
Dado que soy administrador autenticado y el aeropuerto no tiene vuelos vigentes
asociados,
Cuando selecciono el aeropuerto, presiono "Eliminar" y confirmo,
Entonces el sistema elimina el aeropuerto y deja de ofrecerlo como origen y
destino.

Descripción más detallada
Camino de éxito
1.El administrador accede a la pantalla de gestión de aeropuertos.
2.Selecciona el aeropuerto y presiona "Eliminar".
3.El sistema muestra un popup pidiendo confirmación.
4.El administrador confirma.
5.El sistema elimina el aeropuerto y muestra el mensaje de confirmación.
Caminos alternativos
1.Aeropuerto con vuelos vigentes.

a.El aeropuerto seleccionado es origen o destino de vuelos vigentes.
b.El sistema no permite la baja y muestra el mensaje "No se puede eliminar

un aeropuerto asociado a vuelos vigentes".

2.El administrador no confirma.

a.El administrador presiona "No" en el popup de confirmación.
b.El sistema no elimina nada y lo deja en la pantalla de gestión.

Wireframe asociado: wireframe_abm_aeropuertos.png

Título: Modificación de aeropuertos

ID: US-05

Prioridad: Alta

Estimación:3 hs

Sprint:1

Alumno asignado: Alumno 3

Historia de Usuario
Cómo administrador del sistema,
necesito poder modificar los datos de un aeropuerto existente
con la finalidad de corregirlos o actualizarlos sin tener que darlo de baja y volver
a crearlo.

Criterio de aceptación
Dado que soy administrador autenticado y el aeropuerto existe en el sistema,
Cuando selecciono el aeropuerto, presiono "Editar", modifico sus datos y presiono
"Guardar",
Entonces el sistema guarda los cambios y los refleja en los vuelos y búsquedas
que usan ese aeropuerto.

Descripción más detallada
Camino de éxito
1.El administrador accede a la pantalla de gestión de aeropuertos.
2.Selecciona el aeropuerto y presiona "Editar".
3.Modifica los datos deseados.
4.Presiona "Guardar".
5.El sistema guarda los cambios y muestra el mensaje "Aeropuerto actualizado

correctamente".
Caminos alternativos
1.Campos obligatorios incompletos.

a.El administrador borra algún campo obligatorio.
b.El sistema marca en rojo el campo y no habilita el guardado.

2.Código duplicado.

a.El administrador cambia el código por uno ya registrado.
b.El sistema muestra el mensaje "Ya existe un aeropuerto con ese código"

y no guarda.

3.Error de conexión con la base de datos.

a.Ocurre un error de comunicación al guardar.
b.El sistema informa que no se pudieron guardar los datos y sugiere

contactar al equipo técnico.

Wireframe asociado: wireframe_abm_aeropuertos.png

Título: Alta de aviones

ID: US-06

Prioridad: Alta

Estimación:4 hs

Sprint:1

Alumno asignado: Alumno 4

Historia de Usuario
Cómo administrador del sistema,
necesito poder registrar nuevos aviones en la flota con su capacidad de asientos
en clase Economy y Primera Clase
con la finalidad de asignarlos a los vuelos y controlar la cantidad de pasajes que
se pueden vender.

Criterio de aceptación
Dado que soy administrador autenticado y estoy en la pantalla de gestión de flota,
Cuando presiono "Nuevo avión", completo el formulario con datos válidos y
presiono "Guardar",
Entonces el sistema registra el avión y lo deja disponible para asignarlo a vuelos.

Descripción más detallada
Camino de éxito
1.El administrador accede a la pantalla de gestión de flota y presiona "Nuevo

avión".

2.Completa la matrícula y el modelo del avión.
3.Completa la capacidad de Economy y la de Primera Clase.
4.Presiona "Guardar".
5.El sistema guarda el avión y muestra el mensaje "Avión registrado

correctamente".
Caminos alternativos
1.Capacidades inválidas.

a.El administrador ingresa una capacidad negativa o no entera.
b.El sistema muestra el error debajo del campo y no guarda.

2.Matrícula duplicada.

a.El administrador ingresa una matrícula ya registrada.
b.El sistema muestra el mensaje "Ya existe un avión con esa matrícula" y

no guarda.

3.Error de conexión con la base de datos.

a.Ocurre un error de comunicación al guardar.
b.El sistema informa que no se pudieron guardar los datos y sugiere

contactar al equipo técnico.

Wireframe asociado: wireframe_abm_aviones.png

Título: Baja de aviones

ID: US-07

Prioridad: Alta

Estimación:3 hs

Sprint: 1

Alumno asignado: Alumno 5

Historia de Usuario
Cómo administrador del sistema,
necesito poder dar de baja aviones de la flota
con la finalidad de retirar los que dejan de operar y evitar que se asignen a
nuevos vuelos.

Criterio de aceptación
Dado que soy administrador autenticado y el avión no está asignado a vuelos
vigentes,
Cuando selecciono el avión, presiono "Dar de baja" y confirmo,
Entonces el sistema retira el avión de la flota y deja de ofrecerlo al crear vuelos.

Descripción más detallada
Camino de éxito
1.El administrador accede a la pantalla de gestión de flota.
2.Selecciona el avión y presiona "Dar de baja".
3.El sistema muestra un popup pidiendo confirmación.
4.El administrador confirma.
5.El sistema da de baja el avión y muestra el mensaje de confirmación.
Caminos alternativos
1.Avión asignado a vuelos vigentes.

a.El avión seleccionado está asignado a uno o más vuelos vigentes.
b.El sistema no permite la baja y muestra el mensaje "No se puede dar de

baja un avión asignado a vuelos vigentes".

2.El administrador no confirma.

a.El administrador presiona "No" en el popup de confirmación.
b.El sistema no da de baja el avión y lo deja en la pantalla de gestión.

Wireframe asociado: wireframe_abm_aviones.png

Título: Modificación de aviones

ID: US-08

Prioridad: Alta

Estimación:4 hs

Sprint:1

Alumno asignado: Alumno 6

Historia de Usuario
Cómo administrador del sistema,
necesito poder modificar los datos de un avión, incluida su capacidad de asientos
por clase
con la finalidad de reflejar los cambios en la configuración del avión y mantener
correcto el control de ocupación.

Criterio de aceptación
Dado que soy administrador autenticado y el avión existe en la flota,
Cuando seleccionó el avión, presione "Editar", modificar sus datos y presione
"Guardar",
Entonces el sistema guarda los cambios validando que las capacidades sean
enteros no negativos.

Descripción más detallada
Camino de éxito
1.El administrador accede a la pantalla de gestión de flota.
2.Selecciona el avión y presiona "Editar".
3.Modifica el modelo o las capacidades de Economy y Primera Clase.
4.Presiona "Guardar".
5.El sistema guarda los cambios y muestra el mensaje "Avión actualizado

correctamente".
Caminos alternativos
1.Capacidades inválidas.

a.El administrador ingresa una capacidad negativa o no entera.
b.El sistema muestra el error debajo del campo y no guarda.

2.Error de conexión con la base de datos.

a.Ocurre un error de comunicación al guardar.
b.El sistema informa que no se pudieron guardar los datos y sugiere

contactar al equipo técnico.

Wireframe asociado: wireframe_abm_aviones.png

Título: Creación de vuelos

ID: US-09

Prioridad: Alta

Estimación: 10 hs  Sprint: 1

Alumno asignado: Alumno 7

Historia de Usuario
Cómo administrador del sistema,
necesito poder dar de alta un vuelo con su ruta, horarios, días de operación,
avión asignado y precios por clase
con la finalidad de poner el vuelo a disposición de los pasajeros y del personal
de mostrador para su venta.

Criterio de aceptación
Dado que soy administrador autenticado en el sistema y estoy en la pantalla de
gestión de vuelos,
Cuando presiono el botón "Nuevo vuelo", completo el formulario con datos válidos
y presiono "Guardar",
Entonces el sistema registra el vuelo y genera un viaje por cada fecha en que
opera dentro de su período de vigencia, cada uno con un stock por clase igual a la
capacidad del avión asignado, y los deja disponibles para la búsqueda de pasajes.

Descripción más detallada
Camino de éxito
1.El administrador accede a la pantalla de gestión de vuelos y presiona "Nuevo

vuelo".

2.Completa el número de vuelo, el aeropuerto de origen y el de destino

(seleccionados de la lista precargada).
3.Completa el horario de salida y el de llegada.
4.Selecciona los días de la semana en que opera el vuelo y el período de vigencia

(fecha de inicio y fecha de fin).

5.Selecciona el avión asignado; el sistema muestra automáticamente la capacidad

de Economy y de Primera de ese avión.
6.Carga el precio por pasaje para cada clase.
7.Presiona "Guardar".
8.El sistema guarda el vuelo, crea el stock de cada clase igual a la capacidad del
avión y muestra el mensaje "Vuelo creado correctamente" con el número de
vuelo asignado.
Caminos alternativos
1.Origen y destino iguales.

a.El administrador selecciona el mismo aeropuerto como origen y destino.
b.Presiona "Guardar".
c.El sistema no guarda el vuelo y muestra el mensaje "El aeropuerto de

origen y el de destino deben ser distintos".

2.Campos obligatorios incompletos.

a.El administrador deja sin completar algún campo obligatorio o no

selecciona ningún día de operación.

b.El sistema marca en rojo los campos faltantes, indica "Debe seleccionar
al menos un día de operación" cuando corresponda y no habilita el
guardado.
3.Fechas u horarios inválidos.

a.El administrador ingresa una fecha de fin anterior a la de inicio, una fecha

de inicio pasada o un horario de llegada anterior al de salida.

b.El sistema muestra el mensaje correspondiente debajo del campo y no

guarda el vuelo.

4.Número de vuelo duplicado.

a.El administrador ingresa un número de vuelo ya existente en el mismo

período.

b.El sistema muestra el mensaje "Ya existe un vuelo con ese número" y no

guarda.

5.Error de conexión con la base de datos.

a.Ocurre un error de comunicación al guardar.
b.El sistema informa que no se pudieron guardar los datos y sugiere

contactar al equipo técnico.

Wireframe asociado: wireframe_alta_vuelo.png
Nota: Según el RF12, depende del alta de aeropuertos (RF06, US-03) y del alta
de aviones (RF09, US-06): deben existir antes de crear el vuelo. Todos los vuelos
son directos, sin escalas. La aplicación móvil se desarrolla recién en el Sprint 4: el
Sprint 1 prioriza la pagina web.

Título: Modificación de vuelos

ID: US-10

Prioridad: Alta

Estimación:8 hs

Sprint: 1

Alumno asignado: Alumno 8

Historia de Usuario
Cómo administrador del sistema,
necesito poder modificar los datos de un vuelo existente, en particular sus
horarios

con la finalidad de reflejar en el sistema los cambios operativos e informar a los
pasajeros afectados.

Criterio de aceptación
Dado que soy administrador autenticado y el vuelo no está cancelado,
Cuando selecciono el vuelo, presiono "Editar", modifico sus datos y presiono
"Guardar",
Entonces el sistema actualiza el vuelo, lo muestra con los datos nuevos en las
búsquedas y, si cambió el horario, genera la notificación a los pasajeros
afectados.

Descripción más detallada
Camino de éxito
1.El administrador busca el vuelo en la pantalla de gestión de vuelos.
2.Presiona "Editar".
3.Modifica los horarios u otros datos del vuelo.
4.Presiona "Guardar".
5.El sistema valida y guarda los cambios.
6.Si se modificó el horario, el sistema genera la notificación a los pasajeros con

compras en ese vuelo.

Caminos alternativos
1.Horarios inválidos.

a.El administrador ingresa un horario de llegada anterior al de salida.
b.El sistema muestra el mensaje correspondiente debajo del campo y no

guarda.

2.Vuelo cancelado.

a.El administrador selecciona un vuelo en estado "Cancelado".
b.El botón "Editar" no está disponible para ese vuelo.

3.Error de conexión con la base de datos.

a.Ocurre un error de comunicación al guardar.
b.El sistema informa que no se pudieron guardar los datos y sugiere

contactar al equipo técnico.

Wireframe asociado: wireframe_modificar_vuelo.png

Título: Cancelación de un vuelo por el administrador

ID: US-11

Prioridad: Alta

Estimación: 8 hs

Sprint: 1

Alumno asignado: Alumno 9

Historia de Usuario

Cómo administrador del sistema,
necesito poder cancelar un vuelo indicando el motivo
con la finalidad de reflejar en el sistema las contingencias operativas y liberar las
compras asociadas.

Criterio de aceptación
Dado que soy administrador autenticado y el vuelo tiene más de 3 horas hasta su
salida,
Cuando selecciono el vuelo, presiono "Cancelar vuelo", ingreso el motivo y
confirmo,
Entonces el sistema marca el vuelo como cancelado, registra el motivo y deja de
ofrecerlo en las búsquedas.

Descripción más detallada
Camino de éxito
1.El administrador busca el vuelo en la pantalla de gestión de vuelos.
2.Presiona el botón "Cancelar vuelo".
3.El sistema solicita el motivo de la cancelación, que es obligatorio.
4.El administrador ingresa el motivo y confirma en el popup.
5.El sistema cambia el estado del vuelo a "Cancelado", registra el motivo y la

fecha, lo quita de los resultados de búsqueda y marca las compras asociadas
como afectadas.
Caminos alternativos
1.Se intenta cancelar con menos de 3 horas de anticipación.

a.Faltan menos de 3 horas para la salida del vuelo.
b.El sistema no permite la cancelación y muestra el mensaje "No es posible

cancelar un vuelo con menos de 3 horas de anticipación".

2.Motivo vacío.

a.El administrador deja el campo de motivo sin completar.
b.El botón de confirmación permanece deshabilitado.

3.El administrador no confirma.

a.El administrador presiona "No" en el popup de confirmación.
b.El sistema no cancela el vuelo y lo deja en la pantalla de gestión.

Wireframe asociado: wireframe_cancelar_vuelo.png

