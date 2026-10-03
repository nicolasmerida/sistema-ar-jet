# Guía 2 — Next.js y TypeScript desde cero (aplicado al Sistema AR-Jet)

> Para quien **no sabe nada** de TypeScript ni de Next.js.
> Versiones verificadas en octubre de 2026: **Next.js 16.3**, **React 19.2**, **TypeScript 5.9** (la que instala `create-next-app`), **Node.js 22**, **Express 5**.
> Todo el código del ejemplo completo (sección 9) fue compilado y ejecutado contra PostgreSQL antes de escribir esta guía.

---

## Índice

**Parte A — El panorama**
1. [Qué es cada tecnología y cómo encajan](#1-qué-es-cada-tecnología-y-cómo-encajan)
2. [Arquitectura del Sistema AR-Jet](#2-arquitectura-del-sistema-ar-jet)
3. [Instalación y herramientas](#3-instalación-y-herramientas)

**Parte B — El lenguaje: TypeScript**
4. [TypeScript desde cero](#4-typescript-desde-cero)

**Parte C — El frontend: React + Next.js**
5. [React: lo que tenés que saber antes de Next.js](#5-react-lo-que-tenés-que-saber-antes-de-nextjs)
6. [Next.js: estructura de carpetas y archivos](#6-nextjs-estructura-de-carpetas-y-archivos)
7. [Next.js: funciones y conceptos principales](#7-nextjs-funciones-y-conceptos-principales)

**Parte D — El backend**
8. [Backend con Node.js + Express + TypeScript](#8-backend-con-nodejs--express--typescript)

**Parte E — Todo junto**
9. [Ejemplo completo: US-00 "Alta de aeropuertos"](#9-ejemplo-completo-us-00-alta-de-aeropuertos)
10. [Modelado de las entidades de AR-Jet en TypeScript y SQL](#10-modelado-de-las-entidades-de-ar-jet)
11. [Autenticación y roles (pasajero, empleado, administrador)](#11-autenticación-y-roles)
12. [Buenas prácticas, errores comunes y glosario](#12-buenas-prácticas-errores-comunes-y-glosario)

---

# Parte A — El panorama

## 1. Qué es cada tecnología y cómo encajan

| Tecnología | Qué es | Analogía |
|---|---|---|
| **JavaScript (JS)** | El lenguaje que entienden los navegadores. También corre en servidores. | El idioma. |
| **TypeScript (TS)** | JavaScript + **tipos**. Se escribe en `.ts`/`.tsx` y se **compila** (traduce) a JavaScript. Detecta errores antes de ejecutar. | El mismo idioma, pero con un corrector ortográfico estricto. |
| **Node.js** | Programa que ejecuta JavaScript **fuera** del navegador (en un servidor o en tu PC). | El motor. |
| **npm** | Gestor de paquetes de Node: instala librerías y corre scripts. | La tienda de repuestos. |
| **React** | Librería para construir interfaces con **componentes** reutilizables. | Los ladrillos de la interfaz. |
| **Next.js** | Framework construido sobre React: agrega rutas por carpetas, renderizado en servidor, API, optimizaciones, build. | La casa ya planificada, hecha con esos ladrillos. |
| **Express** | Librería minimalista para crear APIs HTTP con Node.js. | El mostrador que atiende pedidos. |
| **PostgreSQL** | Base de datos relacional (tablas, SQL). | El archivo de la empresa. |
| **Neon** | Servicio que aloja PostgreSQL en la nube. | El edificio donde está guardado el archivo. |

### ¿Por qué TypeScript y no JavaScript puro?

```ts
// JavaScript: este error recién aparece al ejecutar (o nunca, y da un resultado raro)
function precioTotal(precio, cantidad) { return precio * cantidad; }
precioTotal("1000", 3); // "1000" * 3 = 3000... por suerte. Pero "1000" + 3 = "10003"

// TypeScript: el editor lo marca en rojo ANTES de ejecutar
function precioTotal(precio: number, cantidad: number): number {
  return precio * cantidad;
}
precioTotal("1000", 3); // ❌ Error: Argument of type 'string' is not assignable to parameter of type 'number'
```

Los tipos **solo existen mientras programás**. Al compilar se borran y queda JavaScript normal.

---

## 2. Arquitectura del Sistema AR-Jet

Según el README del repo, el stack es: **frontend Next.js**, **backend Node.js con TypeScript**, **PostgreSQL en Neon**.

```text
 ┌──────────────────────┐     HTTP (fetch, JSON)     ┌──────────────────────┐     SQL      ┌──────────────┐
 │   NAVEGADOR          │ ─────────────────────────▶ │  BACKEND (backend/)  │ ───────────▶ │  PostgreSQL  │
 │                      │                            │  Node + Express + TS │              │   (Neon)     │
 │  FRONTEND (frontend/)│ ◀───────────────────────── │  :4000  /api/...     │ ◀─────────── │              │
 │  Next.js + React     │        JSON                └──────────────────────┘              └──────────────┘
 │  :3000               │
 └──────────────────────┘
```

- **Frontend (`frontend/`)**: pantallas para **pasajeros**, **empleados de mostrador** y **administradores** (el enunciado pide "interfaces separadas pero con experiencia visual unificada").
- **Backend (`backend/`)**: la API REST con las reglas de negocio (máximo 9 pasajes por transacción, no borrar aeropuertos con vuelos vigentes, etc.) y el acceso a la base.
- **Base de datos**: tablas derivadas de `docs/comision-analista/Entidades-BD.docx` y `Diagrama-ER.drawio`.

> **Nota:** Next.js también puede funcionar como backend (con *Route Handlers* y *Server Actions*, sección 7). Como el repo ya separa `frontend/` y `backend/`, esta guía usa un backend Express aparte y además explica la alternativa, para que el equipo decida con conocimiento.

### Qué es una API REST

El frontend le pide cosas al backend con **requests HTTP**. Cada request tiene un **método** y una **ruta**:

| Método | Significado | Ejemplo AR-Jet | Código de respuesta típico |
|---|---|---|---|
| `GET` | Leer | `GET /api/vuelos?origen=BHI&destino=AEP` | 200 OK |
| `POST` | Crear | `POST /api/aeropuertos` | 201 Created |
| `PUT` / `PATCH` | Modificar (todo / una parte) | `PATCH /api/vuelos/12` | 200 OK |
| `DELETE` | Borrar | `DELETE /api/aviones/5` | 204 No Content |

Códigos de error comunes: **400** datos inválidos, **401** no autenticado, **403** sin permiso, **404** no existe, **409** conflicto (duplicado), **500** error del servidor.

Los datos viajan en **JSON**:

```json
{ "codigo": "BHI", "nombre": "Comandante Espora", "ciudad": "Bahía Blanca" }
```

---

## 3. Instalación y herramientas

### 3.1 Programas

1. **Node.js 22 LTS** o superior → https://nodejs.org (incluye `npm`). Verificar:
   ```bash
   node -v    # v22.x.x o superior
   npm -v
   ```
2. **Git** → https://git-scm.com
3. **VS Code** → https://code.visualstudio.com con las extensiones: *ESLint*, *Prettier*, *Tailwind CSS IntelliSense*, *PostgreSQL* (opcional).

### 3.2 Crear el proyecto frontend

Desde la raíz del repo (la carpeta `frontend/` ya existe con un README; muevan o borren ese README antes, porque `create-next-app` exige una carpeta sin archivos conflictivos):

```bash
npx create-next-app@latest frontend --yes
```

`--yes` usa los valores recomendados: **TypeScript, ESLint, Tailwind CSS, App Router, alias `@/*`**. Después:

```bash
cd frontend
npm run dev        # abre http://localhost:3000 con recarga automática
```

### 3.3 Comandos de npm que vas a usar todos los días

| Comando | Qué hace |
|---|---|
| `npm install` | Instala todo lo listado en `package.json` (crea `node_modules/`). Hacelo después de cada `git pull`. |
| `npm install <paquete>` | Agrega una dependencia (ej. `npm install zod`). |
| `npm install -D <paquete>` | Agrega una dependencia **de desarrollo** (solo para programar, ej. tipos). |
| `npm run dev` | Servidor de desarrollo con recarga en caliente. |
| `npm run build` | Compila para producción. **Si falla acá, falla en la demo.** |
| `npm run start` | Ejecuta lo compilado por `build`. |
| `npm run lint` | Revisa errores de estilo y malas prácticas. |

### 3.4 El archivo `package.json`

Es la "ficha" del proyecto. El que genera `create-next-app` hoy es:

```json
{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "next": "16.3.8",
    "react": "19.2.8",
    "react-dom": "19.2.8"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.3.8",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

- `scripts`: lo que corre `npm run <nombre>`.
- `dependencies`: librerías que usa la app en ejecución.
- `devDependencies`: herramientas solo para desarrollar.
- `^5` significa "cualquier 5.x compatible".
- `package-lock.json` fija las versiones exactas: **se commitea**. `node_modules/` **no** se commitea (ya está en `.gitignore`).

---

# Parte B — El lenguaje

## 4. TypeScript desde cero

### 4.1 Variables

```ts
let edad = 25;           // let: puede cambiar
const nombre = "Ana";    // const: no se puede reasignar (usala por defecto)
// var: forma vieja, NO la uses

edad = 26;     // ✅
nombre = "Eva"; // ❌ Error: Cannot assign to 'nombre' because it is a constant
```

### 4.2 Tipos básicos

```ts
const codigo: string = "BHI";
const capacidad: number = 180;      // enteros y decimales son "number"
const disponible: boolean = true;
const nada: null = null;
let sinValor: undefined = undefined;

// Inferencia: TS deduce el tipo solo. Esto es equivalente y es lo más común:
const ciudad = "Bahía Blanca";      // TS sabe que es string
```

Regla práctica: **no anotes tipos cuando TS los deduce**; anotalos en parámetros de funciones, en lo que exportás y cuando el valor inicial no alcanza.

### 4.3 Arrays y tuplas

```ts
const codigos: string[] = ["BHI", "AEP", "COR"];
const precios: Array<number> = [85000, 120000];  // forma equivalente

const coordenada: [number, number] = [-38.72, -62.27]; // tupla: largo y tipos fijos
```

### 4.4 Objetos, `type` e `interface`

```ts
// Objeto literal
const avion = { id_avion: 1, matricula: "LV-ABC", capacidad_economy: 150, capacidad_primera: 12 };

// Definir la "forma" con interface
interface Avion {
  id_avion: number;
  matricula: string;
  modelo?: string;              // ? = opcional (puede no estar)
  readonly capacidad_economy: number; // readonly = no se puede modificar
  capacidad_primera: number;
}

// O con type (alias de tipo)
type Pasajero = {
  dni: string;
  nombre: string;
  apellido: string;
};

const p: Pasajero = { dni: "40123456", nombre: "Juan", apellido: "Pérez" };
```

**¿`type` o `interface`?** Para objetos son casi equivalentes. Convención útil: `interface` para formas de objetos/entidades, `type` para uniones, combinaciones y alias. Elijan una convención y manténganla.

```ts
// Extender
interface Usuario { dni: string; nombre: string; apellido: string; }
interface Administrador extends Usuario { permisos: string[]; }

type Empleado = Usuario & { legajo: number };   // "&" = intersección (une ambos)
```

### 4.5 Uniones y tipos literales (muy útiles para AR-Jet)

```ts
// Union: puede ser uno u otro
let id: number | string;

// Tipos literales: solo esos valores exactos (salen del Diagrama ER)
type EstadoViaje = "Programado" | "En vuelo" | "Aterrizado" | "Demorado" | "Cancelado";
type EstadoCompra = "Pendiente" | "Pagada" | "Cancelada" | "Vencida";
type Clase = "Economy" | "Primera";
type Rol = "pasajero" | "empleado" | "administrador";

let estado: EstadoViaje = "Programado"; // ✅
estado = "Volando";                      // ❌ Error: no es un valor permitido
```

### 4.6 Funciones

```ts
// Función clásica
function calcularTotal(precioUnitario: number, cantidad: number): number {
  return precioUnitario * cantidad;
}

// Arrow function (función flecha): la forma más usada en React
const calcularTotal2 = (precioUnitario: number, cantidad: number): number =>
  precioUnitario * cantidad;

// Parámetro opcional y valor por defecto
function saludar(nombre: string, titulo?: string, saludo = "Hola"): string {
  return `${saludo}, ${titulo ? titulo + " " : ""}${nombre}`; // template string con ``
}

// Función que no devuelve nada
function registrar(mensaje: string): void {
  console.log(mensaje);
}

// Funciones como parámetros (callback)
function aplicarDescuento(precio: number, regla: (p: number) => number): number {
  return regla(precio);
}
aplicarDescuento(1000, (p) => p * 0.9); // 900
```

### 4.7 Clases

```ts
class Vuelo {
  // Propiedades con modificadores de acceso:
  //   public    -> accesible desde cualquier lado (por defecto)
  //   private   -> solo dentro de esta clase
  //   protected -> esta clase y sus subclases
  //   readonly  -> no se puede modificar después del constructor
  private asientosVendidosEconomy = 0;
  static readonly MAX_PASAJES_POR_COMPRA = 9; // static: pertenece a la clase, no a cada objeto

  // "Parameter properties": declarar y asignar en el constructor en una línea
  constructor(
    public readonly id: number,
    public origen: string,
    public destino: string,
    private capacidadEconomy: number,
  ) {}

  // Getter: se usa como propiedad (vuelo.asientosLibres), no como función
  get asientosLibres(): number {
    return this.capacidadEconomy - this.asientosVendidosEconomy;
  }

  venderPasajes(cantidad: number): void {
    if (cantidad > Vuelo.MAX_PASAJES_POR_COMPRA) {
      throw new Error(`Máximo ${Vuelo.MAX_PASAJES_POR_COMPRA} pasajes por transacción`);
    }
    if (cantidad > this.asientosLibres) {
      throw new Error("No hay asientos suficientes");
    }
    this.asientosVendidosEconomy += cantidad;
  }
}

const v = new Vuelo(1, "BHI", "AEP", 150);
v.venderPasajes(3);
console.log(v.asientosLibres); // 147
v.capacidadEconomy;            // ❌ Error: es private
```

**Herencia, clases abstractas e interfaces implementadas:**

```ts
interface Notificable {
  notificar(mensaje: string): Promise<void>;
}

abstract class Persona {
  constructor(public dni: string, public nombre: string, public apellido: string) {}

  get nombreCompleto(): string {
    return `${this.nombre} ${this.apellido}`;
  }

  abstract describir(): string; // las subclases ESTÁN OBLIGADAS a implementarlo
}

class Cliente extends Persona implements Notificable {
  constructor(dni: string, nombre: string, apellido: string, public email: string) {
    super(dni, nombre, apellido); // llama al constructor de Persona
  }

  describir(): string {
    return `Cliente ${this.nombreCompleto}`;
  }

  async notificar(mensaje: string): Promise<void> {
    console.log(`Enviando a ${this.email}: ${mensaje}`);
  }
}

const c = new Cliente("40123456", "Ana", "Gómez", "ana@mail.com");
c.describir(); // "Cliente Ana Gómez"
```

> **Importante sobre el estilo real:** en React/Next.js moderno **casi no se usan clases** para la interfaz (los componentes son funciones). Las clases aparecen más en el backend (errores personalizados, servicios) y en la lógica de dominio. Lo más común en proyectos TS es **interfaces/types para los datos + funciones para la lógica**.

### 4.8 Genéricos

Un genérico es un **tipo como parámetro**. Permite escribir código reutilizable sin perder el tipado.

```ts
// T es "cualquier tipo, decidido al usarla"
function primero<T>(lista: T[]): T | undefined {
  return lista[0];
}
const a = primero(["BHI", "AEP"]); // a: string | undefined
const b = primero([1, 2, 3]);      // b: number | undefined

// Tipo genérico para respuestas de la API
interface RespuestaPaginada<T> {
  datos: T[];
  total: number;
  pagina: number;
}
const r: RespuestaPaginada<Avion> = { datos: [], total: 0, pagina: 1 };
```

Los vas a ver todo el tiempo: `Promise<number>`, `Array<string>`, `useState<string>("")`, `pool.query<Aeropuerto>(...)`.

### 4.9 Tipos utilitarios

```ts
interface Aeropuerto { id_aeropuerto: number; codigo: string; nombre: string; ciudad: string; }

type AeropuertoNuevo  = Omit<Aeropuerto, "id_aeropuerto">;     // todo menos el id
type AeropuertoEdicion = Partial<AeropuertoNuevo>;             // todo opcional (para PATCH)
type SoloCodigo       = Pick<Aeropuerto, "codigo" | "nombre">; // solo esos campos
type PreciosPorClase  = Record<Clase, number>;                 // { Economy: number; Primera: number }

const precios: PreciosPorClase = { Economy: 85000, Primera: 240000 };
```

### 4.10 `null`, `undefined` y narrowing (estrechamiento)

Con `strict: true` (activado por defecto), TS te obliga a contemplar el caso "no hay valor".

```ts
function buscarAvion(id: number): Avion | undefined { /* ... */ return undefined; }

const avion = buscarAvion(5);
avion.matricula;           // ❌ Error: 'avion' is possibly 'undefined'

if (avion) {
  avion.matricula;         // ✅ dentro del if, TS sabe que existe ("narrowing")
}

avion?.matricula;          // optional chaining: si es undefined, da undefined (no explota)
const m = avion?.modelo ?? "Sin modelo"; // ?? = "si es null/undefined, usá esto"

// Narrowing con typeof / instanceof / in
function formatear(x: string | number) {
  if (typeof x === "number") return x.toFixed(2);
  return x.toUpperCase();
}
```

**`any` vs `unknown`:** `any` apaga el chequeo de tipos (evitalo). `unknown` significa "no sé qué es, verificalo antes de usarlo" (usalo para datos externos o errores).

```ts
try {
  // ...
} catch (err: unknown) {
  const mensaje = err instanceof Error ? err.message : "Error desconocido";
}
```

### 4.11 Enums (y por qué conviene la unión de literales)

```ts
enum EstadoViajeEnum { Programado = "Programado", Cancelado = "Cancelado" }
```

Funcionan, pero en proyectos modernos se prefiere la **unión de literales** (`type EstadoViaje = "Programado" | ...`): no genera código extra y se lleva mejor con JSON que viene de la base.

### 4.12 Desestructuración, spread y rest

```ts
const pasajero = { dni: "1", nombre: "Ana", apellido: "Gómez", email: "a@m.com" };

const { nombre, apellido } = pasajero;        // desestructurar objeto
const [primerCodigo, ...resto] = ["BHI", "AEP", "COR"]; // desestructurar array + rest

const actualizado = { ...pasajero, email: "nuevo@m.com" }; // spread: copia y pisa un campo
const todos = [...codigos, "MDQ"];                           // copia el array y agrega

function sumar(...numeros: number[]) { return numeros.reduce((a, b) => a + b, 0); }
```

**Inmutabilidad:** en React nunca modifiques un objeto/array del estado directamente; creá uno nuevo con spread.

### 4.13 Métodos de arrays (los vas a usar en todas las pantallas)

```ts
const vuelos = [
  { id: 1, origen: "BHI", destino: "AEP", precio: 85000 },
  { id: 2, origen: "BHI", destino: "COR", precio: 95000 },
  { id: 3, origen: "AEP", destino: "BHI", precio: 87000 },
];

vuelos.map((v) => v.destino);                    // ["AEP", "COR", "BHI"]   transforma
vuelos.filter((v) => v.origen === "BHI");        // los 2 primeros         filtra
vuelos.find((v) => v.id === 2);                  // el objeto con id 2      busca uno
vuelos.some((v) => v.precio > 90000);            // true                    ¿alguno cumple?
vuelos.every((v) => v.precio > 0);               // true                    ¿todos cumplen?
vuelos.reduce((total, v) => total + v.precio, 0);// 267000                  acumula
[...vuelos].sort((a, b) => a.precio - b.precio); // ordena (copiando primero)
```

`===` compara valor **y** tipo. Usá siempre `===` y `!==`, nunca `==`.

### 4.14 Asincronía: Promise, async/await

Todo lo que tarda (consultar la base, llamar a la API, enviar un email) es **asíncrono** y devuelve una `Promise`.

```ts
// Sin await obtenés la promesa, no el valor
async function obtenerVuelos(): Promise<Vuelo[]> {
  const respuesta = await fetch("http://localhost:4000/api/vuelos"); // espera la respuesta
  if (!respuesta.ok) {
    throw new Error(`Error HTTP ${respuesta.status}`);
  }
  return respuesta.json(); // espera y convierte el JSON
}

async function main() {
  try {
    const vuelos = await obtenerVuelos();
    console.log(vuelos.length);
  } catch (error) {
    console.error("Falló:", error);
  }
}

// Varias cosas en paralelo
const [aeropuertos, aviones] = await Promise.all([obtenerAeropuertos(), obtenerAviones()]);
```

Regla: **`await` solo se usa dentro de funciones `async`** (o en el nivel superior de un módulo).

### 4.15 Módulos: `import` y `export`

Cada archivo es un módulo. Lo que no exportás es privado del archivo.

```ts
// lib/precios.ts
export const IVA = 0.21;                                   // export con nombre
export function conIva(p: number) { return p * (1 + IVA); }
export default function formatearPesos(p: number) {        // export por defecto (uno por archivo)
  return p.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
}

// otro archivo
import formatearPesos, { IVA, conIva } from "@/lib/precios";
import type { Aeropuerto } from "@/lib/tipos"; // import type: solo trae el tipo (se borra al compilar)
```

`@/` es un **alias** configurado en `tsconfig.json` que apunta a la raíz del proyecto: evita rutas tipo `../../../lib/precios`.

### 4.16 El archivo `tsconfig.json`

Configura el compilador. Lo importante del que genera Next.js:

| Opción | Significado |
|---|---|
| `"strict": true` | Chequeos estrictos (null, any implícito…). **No lo desactiven.** |
| `"noEmit": true` | TS solo verifica; Next.js se encarga de compilar. |
| `"jsx": "react-jsx"` | Permite escribir JSX en `.tsx`. |
| `"paths": { "@/*": ["./*"] }` | El alias `@/`. |
| `"allowJs": true` | Permite mezclar archivos `.js`. |

### 4.17 `.ts` vs `.tsx`

- `.ts`: TypeScript sin HTML (lógica, tipos, API, servicios).
- `.tsx`: TypeScript **con JSX** (componentes de React).

---

# Parte C — El frontend

## 5. React: lo que tenés que saber antes de Next.js

### 5.1 Componentes y JSX

Un componente es **una función que devuelve JSX** (algo parecido a HTML dentro de TS). Su nombre empieza con **mayúscula**.

```tsx
export default function Saludo() {
  const nombre = "Ana";
  return (
    <div className="saludo">         {/* className, no class */}
      <h1>Hola, {nombre}</h1>          {/* {} = insertar una expresión TS */}
      <p>Hoy es {new Date().toLocaleDateString("es-AR")}</p>
    </div>
  );
}
```

Reglas de JSX:
- Devolver **un solo elemento raíz** (o un fragmento `<>...</>`).
- Atributos en camelCase: `className`, `onClick`, `htmlFor`.
- Toda etiqueta se cierra: `<img />`, `<input />`.
- Comentarios: `{/* así */}`.

### 5.2 Props (parámetros de un componente)

```tsx
interface TarjetaVueloProps {
  origen: string;
  destino: string;
  precio: number;
  onComprar?: () => void; // función opcional
}

function TarjetaVuelo({ origen, destino, precio, onComprar }: TarjetaVueloProps) {
  return (
    <div className="border rounded p-4">
      <h3>{origen} → {destino}</h3>
      <p>${precio.toLocaleString("es-AR")}</p>
      {onComprar && <button onClick={onComprar}>Comprar</button>}
    </div>
  );
}

// Uso:
<TarjetaVuelo origen="BHI" destino="AEP" precio={85000} onComprar={() => alert("¡Comprado!")} />
```

Strings van entre comillas; cualquier otra cosa (números, booleanos, objetos, funciones) entre `{}`.

### 5.3 Listas y renderizado condicional

```tsx
function ListaVuelos({ vuelos }: { vuelos: { id: number; destino: string }[] }) {
  if (vuelos.length === 0) return <p>No hay vuelos.</p>;   // return temprano

  return (
    <ul>
      {vuelos.map((v) => (
        <li key={v.id}>{v.destino}</li>   // key única y estable: obligatoria en listas
      ))}
    </ul>
  );
}

// Condicionales dentro del JSX
{cargando ? <p>Cargando...</p> : <Tabla />}   // ternario: uno u otro
{error && <p className="text-red-600">{error}</p>} // &&: mostrar solo si hay error
```

### 5.4 Estado con `useState`

El **estado** es información que, cuando cambia, hace que el componente se vuelva a dibujar.

```tsx
"use client";
import { useState } from "react";

export default function SelectorPasajes() {
  const [cantidad, setCantidad] = useState(1); // [valorActual, funciónParaCambiarlo]

  return (
    <div>
      <button onClick={() => setCantidad(cantidad - 1)} disabled={cantidad <= 1}>-</button>
      <span>{cantidad}</span>
      {/* Regla del enunciado: máximo 9 pasajes por transacción */}
      <button onClick={() => setCantidad(cantidad + 1)} disabled={cantidad >= 9}>+</button>
    </div>
  );
}
```

- Nunca hagas `cantidad = 5`: usá siempre `setCantidad(5)`.
- Los nombres que empiezan con `use` son **hooks**. Solo se llaman en el nivel superior del componente (no dentro de `if` ni de loops).

### 5.5 Eventos y formularios

```tsx
"use client";
import { useState } from "react";

export default function Buscador() {
  const [origen, setOrigen] = useState("");

  function manejarSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); // evita que la página se recargue
    console.log("Buscar vuelos desde", origen);
  }

  return (
    <form onSubmit={manejarSubmit}>
      <input value={origen} onChange={(e) => setOrigen(e.target.value)} placeholder="Origen" />
      <button type="submit">Buscar</button>
    </form>
  );
}
```

Este patrón (`value` + `onChange`) se llama **input controlado**: React es la fuente de verdad del valor.

### 5.6 `useEffect`

Ejecuta código **después** de dibujar (suscripciones, timers, sincronizar con algo externo).

```tsx
useEffect(() => {
  const id = setInterval(() => console.log("tic"), 1000);
  return () => clearInterval(id); // limpieza al desmontar
}, []); // [] = solo al montar. [x] = cada vez que cambie x
```

> En Next.js **no uses `useEffect` para traer datos** de la base o la API si podés evitarlo: es mejor traerlos en un **Server Component** (sección 7.2).

---

## 6. Next.js: estructura de carpetas y archivos

### 6.1 Lo que genera `create-next-app`

```text
frontend/
├── app/                  ← TODA la aplicación (App Router). Las carpetas son rutas.
│   ├── layout.tsx        ← Layout raíz: <html> y <body>, envuelve TODAS las páginas
│   ├── page.tsx          ← Página de inicio: "/"
│   ├── globals.css       ← Estilos globales (importa Tailwind)
│   └── favicon.ico       ← Ícono de la pestaña
├── public/               ← Archivos estáticos servidos tal cual: /logo.png → public/logo.png
├── next.config.ts        ← Configuración de Next.js
├── tsconfig.json         ← Configuración de TypeScript
├── eslint.config.mjs     ← Reglas de ESLint
├── postcss.config.mjs    ← Necesario para Tailwind
├── next-env.d.ts         ← Tipos de Next (no se edita)
├── package.json
├── package-lock.json
├── AGENTS.md / CLAUDE.md ← Instrucciones para agentes de IA (las genera Next.js 16)
├── .next/                ← Resultado de compilar (no se commitea)
└── node_modules/         ← Dependencias instaladas (no se commitea)
```

### 6.2 Enrutamiento por carpetas

**Regla fundamental:** una carpeta dentro de `app/` es un segmento de la URL, y la ruta solo es pública si esa carpeta tiene un **`page.tsx`**.

```text
app/page.tsx                              →  /
app/login/page.tsx                        →  /login
app/vuelos/page.tsx                       →  /vuelos
app/vuelos/[id]/page.tsx                  →  /vuelos/1, /vuelos/57 ...   (ruta dinámica)
app/admin/aeropuertos/page.tsx            →  /admin/aeropuertos
app/admin/aeropuertos/nuevo/page.tsx      →  /admin/aeropuertos/nuevo
app/admin/aeropuertos/[id]/editar/page.tsx → /admin/aeropuertos/3/editar
```

### 6.3 Archivos especiales

| Archivo | Para qué sirve |
|---|---|
| `page.tsx` | La página de esa ruta. Sin él, la ruta no existe. |
| `layout.tsx` | Estructura compartida (menú, barra lateral) que envuelve a las páginas de esa carpeta y subcarpetas. **No se vuelve a renderizar** al navegar entre ellas. |
| `loading.tsx` | Se muestra automáticamente mientras la página carga datos. |
| `error.tsx` | Se muestra si la página lanza un error. **Debe ser Client Component** (`"use client"`). |
| `not-found.tsx` | Página 404 (o cuando llamás a `notFound()`). |
| `route.ts` | Endpoint de API (Route Handler) en vez de página. No puede convivir con `page.tsx` en la misma carpeta. |
| `proxy.ts` *(en la raíz, no en `app/`)* | Código que corre **antes** de cada request (ej. proteger rutas). En Next.js 16 reemplaza al viejo `middleware.ts`, que quedó deprecado. |

### 6.4 Carpetas especiales

| Sintaxis | Nombre | Efecto | Ejemplo |
|---|---|---|---|
| `[id]` | Segmento dinámico | Captura un valor de la URL | `vuelos/[id]` |
| `[...slug]` | Catch-all | Captura varios segmentos | `docs/[...slug]` → `/docs/a/b/c` |
| `(nombre)` | Grupo de rutas | Organiza **sin** aparecer en la URL; permite layouts distintos | `(pasajero)/vuelos` → `/vuelos` |
| `_nombre` | Carpeta privada | Nunca es ruta; para componentes internos | `_components/` |

### 6.5 Estructura propuesta para AR-Jet

Usa grupos de rutas para tener las **tres interfaces separadas con estilo unificado** que pide el enunciado:

```text
frontend/
├── app/
│   ├── layout.tsx                    ← <html>, fuente, estilos comunes a todos
│   ├── page.tsx                      ← Inicio público
│   ├── login/page.tsx
│   ├── (pasajero)/                   ← no aparece en la URL
│   │   ├── layout.tsx                ← menú del pasajero
│   │   ├── vuelos/page.tsx           ← /vuelos  (búsqueda origen/destino/fecha)
│   │   ├── vuelos/[id]/page.tsx      ← /vuelos/12 (detalle y compra)
│   │   ├── compra/page.tsx           ← /compra  (pago, hasta 9 pasajes)
│   │   └── mis-pasajes/page.tsx
│   ├── mostrador/                    ← empleados de mostrador
│   │   ├── layout.tsx
│   │   └── page.tsx                  ← /mostrador
│   └── admin/                        ← administradores
│       ├── layout.tsx                ← menú lateral de administración
│       ├── page.tsx                  ← /admin (dashboard)
│       ├── aeropuertos/              ← US-00, US-01, US-02
│       │   ├── page.tsx
│       │   ├── nuevo/page.tsx
│       │   └── [id]/editar/page.tsx
│       ├── aviones/                  ← US-03, US-04 ...
│       ├── vuelos/
│       └── reportes/page.tsx         ← ocupación por vuelo, clase y fecha
├── components/                       ← componentes reutilizables
│   ├── ui/                           ← Boton.tsx, Input.tsx, Modal.tsx, Tabla.tsx
│   ├── FormularioAeropuerto.tsx
│   └── TarjetaVuelo.tsx
├── lib/                              ← lógica sin interfaz
│   ├── api.ts                        ← funciones que llaman al backend
│   ├── tipos.ts                      ← interfaces compartidas
│   └── formato.ts                    ← formatear fechas, precios
├── public/                           ← logo de AR-Jet, imágenes
└── proxy.ts                          ← protege /admin y /mostrador
```

---

## 7. Next.js: funciones y conceptos principales

### 7.1 `layout.tsx` raíz

```tsx
// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AR-Jet",
  description: "Venta de pasajes de AR-Jet",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>{children}</body>   {/* children = la página actual */}
    </html>
  );
}
```

`LayoutProps<"/">` y `PageProps<"/ruta">` son **tipos globales** que Next.js genera automáticamente (no hace falta importarlos).

Un layout anidado:

```tsx
// app/admin/layout.tsx
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <nav className="w-56 bg-slate-800 text-white p-4 flex flex-col gap-2">
        <Link href="/admin/aeropuertos">Aeropuertos</Link>
        <Link href="/admin/aviones">Aviones</Link>
        <Link href="/admin/vuelos">Vuelos</Link>
        <Link href="/admin/reportes">Reportes</Link>
      </nav>
      <section className="flex-1">{children}</section>
    </div>
  );
}
```

### 7.2 Server Components vs Client Components (EL concepto más importante)

En el App Router **todos los componentes son Server Components por defecto**.

| | Server Component (por defecto) | Client Component (`"use client"`) |
|---|---|---|
| Dónde corre | En el servidor | En el navegador (y se pre-renderiza en el servidor) |
| Puede ser `async` y usar `await` | ✅ | ❌ |
| Acceder a la base / secretos | ✅ | ❌ (todo lo que llega al navegador es visible) |
| `useState`, `useEffect`, `onClick`, `onChange` | ❌ | ✅ |
| APIs del navegador (`window`, `localStorage`, `alert`) | ❌ | ✅ |
| JavaScript enviado al navegador | Ninguno | Sí |

**Cómo decidir:** empezá todo como Server Component. Si necesitás interactividad (estado, eventos), separá **esa parte** en un componente con `"use client"` en la primera línea del archivo.

```tsx
// app/admin/aeropuertos/page.tsx  (Server Component)
import { obtenerAeropuertos } from "@/lib/api";

export default async function Page() {
  const aeropuertos = await obtenerAeropuertos();   // ✅ await directo, sin useEffect
  return <TablaAeropuertos datos={aeropuertos} />;  // puede contener Client Components
}
```

Patrón típico: **la página (server) trae los datos y se los pasa por props al componente interactivo (client)**. Las props que pasan de server a client deben ser serializables (datos, no funciones ni clases).

### 7.3 Navegación

```tsx
import Link from "next/link";
<Link href="/vuelos">Ver vuelos</Link>                // navegación sin recargar la página
<Link href={`/vuelos/${vuelo.id}`}>Detalle</Link>
```

Navegar desde código (solo en Client Components):

```tsx
"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation"; // ¡next/navigation, no next/router!

const router = useRouter();
router.push("/admin/aeropuertos");  // ir a otra página
router.back();                       // volver
router.refresh();                    // volver a pedir datos de los Server Components
```

En Server Components y Server Actions: `import { redirect, notFound } from "next/navigation";`

### 7.4 Rutas dinámicas y parámetros de búsqueda

```tsx
// app/vuelos/[id]/page.tsx  →  /vuelos/25
export default async function DetalleVueloPage(props: PageProps<"/vuelos/[id]">) {
  const { id } = await props.params;   // ⚠️ desde Next.js 15, params es una Promise
  return <h1>Detalle del vuelo {id}</h1>;
}
```

```tsx
// app/vuelos/page.tsx  →  /vuelos?origen=BHI&destino=AEP
export default async function BuscarVuelosPage(props: PageProps<"/vuelos">) {
  const { origen, destino } = await props.searchParams;
  // origen y destino son string | string[] | undefined
  return <p>Vuelos de {origen} a {destino}</p>;
}
```

Los valores de `params` y `searchParams` **siempre son strings**: convertí con `Number(id)` cuando necesites un número, y validá.

### 7.5 Traer datos (data fetching)

En un Server Component, simplemente `await`:

```ts
// lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function obtenerAeropuertos(): Promise<Aeropuerto[]> {
  const res = await fetch(`${API_URL}/api/aeropuertos`, { cache: "no-store" }); // siempre datos frescos
  if (!res.ok) throw new Error("No se pudieron obtener los aeropuertos");
  return res.json();
}
```

Mientras espera, Next muestra el `loading.tsx` de esa carpeta:

```tsx
// app/admin/aeropuertos/loading.tsx
export default function Loading() {
  return <p className="p-8">Cargando aeropuertos...</p>;
}
```

Si falla, muestra `error.tsx`:

```tsx
// app/admin/aeropuertos/error.tsx
"use client";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className="p-8">
      <p>No se pudieron cargar los datos: {error.message}</p>
      <button onClick={() => retry()}>Reintentar</button>
    </div>
  );
}
```

`retry()` vuelve a pedir los datos y re-renderiza la página (en tutoriales anteriores a Next.js 16.2 vas a ver `reset`, que solo re-renderiza sin volver a pedir datos).

### 7.6 Route Handlers (API dentro de Next.js)

Un `route.ts` exporta funciones con el nombre del método HTTP. Métodos soportados: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`.

```ts
// app/api/hola/route.ts
import { NextRequest, NextResponse } from "next/server";

// GET /api/hola?nombre=Ana  →  { "mensaje": "Hola, Ana" }
export async function GET(request: NextRequest) {
  const nombre = request.nextUrl.searchParams.get("nombre") ?? "mundo";
  return NextResponse.json({ mensaje: `Hola, ${nombre}` });
}

// POST /api/hola  con body { "nombre": "Ana" }
export async function POST(request: Request) {
  const body: { nombre?: string } = await request.json();
  return NextResponse.json({ recibido: body.nombre }, { status: 201 });
}
```

Con parámetros dinámicos:

```ts
// app/api/vuelos/[id]/route.ts
export async function GET(_req: Request, ctx: RouteContext<"/api/vuelos/[id]">) {
  const { id } = await ctx.params;
  return Response.json({ id });
}
```

**Esta es la alternativa a tener un backend Express separado:** toda la API vive en `frontend/app/api/...`. Ventaja: un solo proyecto y un solo deploy. Desventaja: mezcla responsabilidades y se aleja de la estructura `frontend/` + `backend/` que ya tiene el repo.

### 7.7 Server Actions (Server Functions)

Funciones marcadas con `"use server"` que corren en el servidor pero se pueden llamar **directamente desde un formulario** sin escribir un endpoint.

```ts
// app/admin/aeropuertos/acciones.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function crearAeropuertoAccion(formData: FormData) {
  const codigo = String(formData.get("codigo") ?? "").trim();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const ciudad = String(formData.get("ciudad") ?? "").trim();

  // ⚠️ Una Server Action es un endpoint público: SIEMPRE validar y verificar permisos acá.
  if (!codigo || !nombre || !ciudad) throw new Error("Campos obligatorios incompletos");

  await fetch(`${process.env.API_URL}/api/aeropuertos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ codigo, nombre, ciudad }),
  });

  revalidatePath("/admin/aeropuertos"); // refresca la lista
  redirect("/admin/aeropuertos");
}
```

```tsx
// En una página (puede ser Server Component, sin "use client")
import { crearAeropuertoAccion } from "./acciones";

<form action={crearAeropuertoAccion}>
  <input name="codigo" required />
  <input name="nombre" required />
  <input name="ciudad" required />
  <button type="submit">Guardar</button>
</form>
```

### 7.8 `proxy.ts` (antes `middleware.ts`)

Corre antes de cada request que coincida con `matcher`. Ideal para **proteger secciones**:

```ts
// proxy.ts  (en la raíz de frontend/, al lado de app/)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const sesion = request.cookies.get("sesion");
  if (!sesion) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/admin/:path*", // protege todo lo que empiece con /admin
};
```

> Si ven tutoriales con `middleware.ts` y `export function middleware`, son de Next.js 15 o anterior. En Next.js 16 el nombre es `proxy`.

### 7.9 Variables de entorno

Archivo `frontend/.env.local` (no se commitea):

```env
NEXT_PUBLIC_API_URL=http://localhost:4000   # visible en el navegador
API_URL=http://localhost:4000               # solo servidor
```

- Solo las que empiezan con **`NEXT_PUBLIC_`** llegan al navegador. **Nunca** pongas secretos con ese prefijo.
- Se leen con `process.env.NOMBRE`. Después de cambiarlas, reiniciá `npm run dev`.

### 7.10 Estilos con Tailwind CSS

`create-next-app` instala **Tailwind CSS 4**: en lugar de escribir CSS, aplicás clases utilitarias.

```tsx
<button className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50">
  Guardar
</button>
```

| Clase | Significado |
|---|---|
| `p-4`, `px-4`, `py-2`, `m-2` | padding / margin (1 unidad = 0.25rem) |
| `flex`, `flex-col`, `gap-3`, `items-center`, `justify-between` | flexbox |
| `w-full`, `max-w-md`, `min-h-screen` | tamaños |
| `text-2xl`, `font-bold`, `text-red-600` | texto |
| `bg-blue-600`, `border`, `rounded` | fondo y bordes |
| `hover:...`, `disabled:...`, `md:...` | variantes por estado o tamaño de pantalla |

Para la "experiencia visual unificada", creen componentes base en `components/ui/` (Boton, Input, Tabla) y úsenlos en las tres interfaces.

### 7.11 Imágenes y metadata

```tsx
import Image from "next/image";
<Image src="/logo-arjet.png" alt="AR-Jet" width={160} height={40} priority />  // archivo en public/
```

```tsx
// Título distinto por página
export const metadata = { title: "Gestión de aeropuertos | AR-Jet" };
```

---

# Parte D — El backend

## 8. Backend con Node.js + Express + TypeScript

### 8.1 Crear el proyecto

```bash
cd backend
npm init -y
npm pkg set type=module                         # usar import/export
npm install express pg zod cors
npm install -D typescript tsx @types/node @types/express @types/pg @types/cors
npx tsc --init                                  # crea tsconfig.json (luego reemplazalo por el de abajo)
```

| Paquete | Para qué |
|---|---|
| `express` | Servidor HTTP y rutas. |
| `pg` | Cliente de PostgreSQL (funciona con Neon). |
| `zod` | Validar datos que llegan del frontend y obtener tipos TS de esas validaciones. |
| `cors` | Permitir que el frontend (puerto 3000) llame al backend (puerto 4000). |
| `typescript` | El compilador. |
| `tsx` | Ejecuta `.ts` directo en desarrollo, con recarga automática. |
| `@types/...` | Tipos de librerías escritas en JS. |

`backend/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

Scripts en `backend/package.json`:

```json
"scripts": {
  "dev": "tsx watch --env-file=.env src/index.ts",
  "build": "tsc",
  "start": "node --env-file=.env dist/index.js",
  "typecheck": "tsc --noEmit"
}
```

`--env-file=.env` hace que Node cargue el `.env` (que ya está descripto en `backend/.env.example`) sin librerías extra.

> **Detalle que confunde al principio:** con `"module": "NodeNext"`, los imports relativos llevan extensión **`.js`** aunque el archivo sea `.ts`: `import { pool } from "./db.js"`. Es correcto: TS lo resuelve al `.ts` y en `dist/` el archivo efectivamente es `.js`.

### 8.2 Arquitectura en capas

```text
backend/
├── .env                    ← DATABASE_URL (no se commitea)
├── .env.example
├── package.json
├── tsconfig.json
├── sql/                    ← scripts de creación de tablas (migraciones)
│   └── 001_aeropuertos.sql
└── src/
    ├── index.ts            ← arranca Express, registra rutas y middlewares
    ├── db.ts               ← conexión (pool) a PostgreSQL / Neon
    ├── errores.ts          ← clases de error propias
    ├── modelos/            ← tipos + esquemas de validación (zod)
    ├── rutas/              ← URL + método → función del controlador
    ├── controladores/      ← leen el request, validan, responden HTTP
    ├── servicios/          ← REGLAS DE NEGOCIO (las de las User Stories)
    ├── repositorios/       ← ÚNICO lugar con SQL
    └── middlewares/        ← autenticación, manejo de errores
```

Flujo de un request:

```text
POST /api/aeropuertos
   │
   ▼
rutas/aeropuertoRutas.ts ──▶ controladores/aeropuertoControlador.ts ──▶ servicios/aeropuertoServicio.ts ──▶ repositorios/aeropuertoRepositorio.ts ──▶ PostgreSQL
   (qué función)              (valida body, arma respuesta HTTP)        (¿código duplicado? → 409)             (INSERT ... RETURNING *)
```

¿Por qué separar? Cada capa tiene **una sola responsabilidad**: si cambia la base, tocás el repositorio; si cambia una regla de negocio, el servicio; si cambia la URL, la ruta. Además, varios integrantes pueden trabajar en paralelo sin pisarse.

### 8.3 Conceptos de Express

```ts
import express from "express";
const app = express();

app.use(express.json());     // middleware: convierte el body JSON en req.body

// Ruta: método + path + handler (req = lo que llega, res = lo que respondés)
app.get("/api/vuelos/:id", async (req, res) => {
  const id = Number(req.params.id);          // parámetro de ruta  /api/vuelos/12
  const clase = req.query.clase;             // query string       ?clase=Economy
  res.status(200).json({ id, clase });       // respuesta JSON
});

app.listen(4000, () => console.log("API en http://localhost:4000"));
```

- **Middleware:** función que se ejecuta en el medio del request (log, auth, parseo). Se registra con `app.use(...)`.
- **Express 5** captura automáticamente los errores de funciones `async` y los pasa al middleware de errores.

### 8.4 Conexión a PostgreSQL / Neon

```ts
// src/db.ts
import pg from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("Falta la variable de entorno DATABASE_URL");
}

// Un "pool" mantiene varias conexiones abiertas y las reutiliza.
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
```

La connection string de Neon ya incluye `?sslmode=require`, que es lo que necesita.

**Consultas parametrizadas — OBLIGATORIO por seguridad:**

```ts
// ✅ Bien: $1, $2 son reemplazados de forma segura por el driver
await pool.query("SELECT * FROM aeropuerto WHERE codigo = $1", [codigo]);

// ❌ MAL: inyección SQL. Si codigo = "'; DROP TABLE aeropuerto; --" borra la tabla
await pool.query(`SELECT * FROM aeropuerto WHERE codigo = '${codigo}'`);
```

**Transacciones** (necesarias para la compra: crear el pago y los pasajes juntos o nada):

```ts
const client = await pool.connect();
try {
  await client.query("BEGIN");
  const { rows } = await client.query(
    "INSERT INTO pago (tipo, estado_compra) VALUES ($1, 'Pendiente') RETURNING cod_compra",
    ["tarjeta"],
  );
  for (const p of pasajeros) {
    await client.query(
      "INSERT INTO pasaje (id_viaje, cod_compra, dni_pasajero, clase) VALUES ($1, $2, $3, $4)",
      [idViaje, rows[0].cod_compra, p.dni, p.clase],
    );
  }
  await client.query("COMMIT");
} catch (e) {
  await client.query("ROLLBACK"); // si algo falla, se deshace todo
  throw e;
} finally {
  client.release();               // devolver la conexión al pool
}
```

> **ORMs:** existen librerías como **Prisma** o **Drizzle** que generan el SQL y los tipos automáticamente. Son buenas opciones, pero agregan conceptos nuevos; para aprender, SQL directo con `pg` es más transparente. Si el equipo elige un ORM, que sea una decisión de todos y al principio del proyecto.

### 8.5 Validación con zod

Nunca confíes en lo que manda el frontend: **validá siempre en el backend**.

```ts
import { z } from "zod";

export const aeropuertoNuevoSchema = z.object({
  codigo: z.string().trim().toUpperCase().length(3, "El código debe tener 3 letras"),
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  ciudad: z.string().trim().min(1, "La ciudad es obligatoria"),
});

// El tipo TS se deduce del esquema: no hay que escribirlo dos veces
export type AeropuertoNuevo = z.infer<typeof aeropuertoNuevoSchema>;

const resultado = aeropuertoNuevoSchema.safeParse(req.body);
if (!resultado.success) {
  // resultado.error.issues → lista de errores por campo
} else {
  // resultado.data → datos limpios y tipados
}
```

Otro ejemplo, regla del enunciado:

```ts
const compraSchema = z.object({
  idViaje: z.number().int().positive(),
  clase: z.enum(["Economy", "Primera"]),
  pasajeros: z
    .array(z.object({ dni: z.string().min(7), nombre: z.string(), apellido: z.string() }))
    .min(1)
    .max(9, "Máximo 9 pasajes por transacción"),
});
```

---

# Parte E — Todo junto

## 9. Ejemplo completo: US-00 "Alta de aeropuertos"

Requisitos (de `docs/comision-analista/UserStories.docx`):
- El administrador completa **código, nombre y ciudad** y presiona "Guardar".
- Éxito → mensaje **"Aeropuerto creado correctamente"**.
- Alt. 1: campos incompletos → **marcados en rojo y "Guardar" deshabilitado**.
- Alt. 2: código repetido → **"Ya existe un aeropuerto con ese código"**.
- Alt. 3: error de base → informar que no se pudo guardar y **sugerir contactar al equipo técnico**.

> Este código fue compilado (`tsc`, `next build`, `eslint`) y probado: `POST` correcto → 201, código repetido → 409, nombre vacío → 400, y la página `/admin/aeropuertos` lista los datos del backend.

### 9.1 Base de datos — `backend/sql/001_aeropuertos.sql`

```sql
CREATE TABLE IF NOT EXISTS aeropuerto (
  id_aeropuerto SERIAL       PRIMARY KEY,
  codigo        VARCHAR(3)   NOT NULL UNIQUE,   -- código IATA, ej. "BHI"
  nombre        VARCHAR(100) NOT NULL,
  ciudad        VARCHAR(100) NOT NULL,
  pais          VARCHAR(100) NOT NULL DEFAULT 'Argentina'
);
```

Se ejecuta en el **SQL Editor** del dashboard de Neon, o con `psql "$DATABASE_URL" -f sql/001_aeropuertos.sql`.

### 9.2 Backend

**`src/errores.ts`** — una clase propia de error (ejemplo real de clase con herencia):

```ts
// Error "de negocio": lleva el código HTTP que hay que devolver.
export class ErrorHttp extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ErrorHttp";
  }
}
```

**`src/modelos/aeropuerto.ts`**

```ts
import { z } from "zod";

// Esquema de validación: describe qué datos aceptamos al crear un aeropuerto.
export const aeropuertoNuevoSchema = z.object({
  codigo: z
    .string()
    .trim()
    .toUpperCase()
    .length(3, "El código debe tener 3 letras"),
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  ciudad: z.string().trim().min(1, "La ciudad es obligatoria"),
});

// TypeScript deduce el tipo a partir del esquema: { codigo: string; nombre: string; ciudad: string }
export type AeropuertoNuevo = z.infer<typeof aeropuertoNuevoSchema>;

// Tipo de un aeropuerto ya guardado en la base (tiene id y país).
export interface Aeropuerto extends AeropuertoNuevo {
  id_aeropuerto: number;
  pais: string;
}
```

**`src/repositorios/aeropuertoRepositorio.ts`**

```ts
import { pool } from "../db.js";
import type { Aeropuerto, AeropuertoNuevo } from "../modelos/aeropuerto.js";

// El repositorio es la ÚNICA capa que escribe SQL.
export const aeropuertoRepositorio = {
  async listar(): Promise<Aeropuerto[]> {
    const { rows } = await pool.query<Aeropuerto>(
      "SELECT * FROM aeropuerto ORDER BY codigo",
    );
    return rows;
  },

  async buscarPorCodigo(codigo: string): Promise<Aeropuerto | null> {
    const { rows } = await pool.query<Aeropuerto>(
      "SELECT * FROM aeropuerto WHERE codigo = $1",
      [codigo],
    );
    return rows[0] ?? null;
  },

  async crear(datos: AeropuertoNuevo): Promise<Aeropuerto> {
    const { rows } = await pool.query<Aeropuerto>(
      `INSERT INTO aeropuerto (codigo, nombre, ciudad)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [datos.codigo, datos.nombre, datos.ciudad],
    );
    return rows[0]!;
  },
};
```

(`rows[0]!` — el `!` le dice a TS "confío en que no es undefined": un `INSERT ... RETURNING` siempre devuelve la fila. Usalo con moderación.)

**`src/servicios/aeropuertoServicio.ts`**

```ts
import { ErrorHttp } from "../errores.js";
import type { Aeropuerto, AeropuertoNuevo } from "../modelos/aeropuerto.js";
import { aeropuertoRepositorio } from "../repositorios/aeropuertoRepositorio.js";

// El servicio contiene las REGLAS DE NEGOCIO (las de la User Story).
export async function crearAeropuerto(datos: AeropuertoNuevo): Promise<Aeropuerto> {
  const existente = await aeropuertoRepositorio.buscarPorCodigo(datos.codigo);
  if (existente) {
    // US-00, camino alternativo 2
    throw new ErrorHttp(409, "Ya existe un aeropuerto con ese código");
  }
  return aeropuertoRepositorio.crear(datos);
}

export function listarAeropuertos(): Promise<Aeropuerto[]> {
  return aeropuertoRepositorio.listar();
}
```

**`src/controladores/aeropuertoControlador.ts`**

```ts
import type { Request, Response } from "express";
import { aeropuertoNuevoSchema } from "../modelos/aeropuerto.js";
import * as servicio from "../servicios/aeropuertoServicio.js";

// El controlador traduce HTTP <-> servicio: lee el request, responde JSON.
export async function listar(_req: Request, res: Response) {
  const aeropuertos = await servicio.listarAeropuertos();
  res.json(aeropuertos);
}

export async function crear(req: Request, res: Response) {
  const resultado = aeropuertoNuevoSchema.safeParse(req.body);
  if (!resultado.success) {
    // US-00, camino alternativo 1: campos obligatorios incompletos
    res.status(400).json({
      error: "Datos inválidos",
      detalles: resultado.error.issues.map((i) => ({
        campo: i.path.join("."),
        mensaje: i.message,
      })),
    });
    return;
  }
  const aeropuerto = await servicio.crearAeropuerto(resultado.data);
  res.status(201).json(aeropuerto);
}
```

**`src/rutas/aeropuertoRutas.ts`**

```ts
import { Router } from "express";
import * as controlador from "../controladores/aeropuertoControlador.js";

export const aeropuertoRutas = Router();

aeropuertoRutas.get("/", controlador.listar);   // GET  /api/aeropuertos
aeropuertoRutas.post("/", controlador.crear);   // POST /api/aeropuertos
```

**`src/middlewares/manejarErrores.ts`**

```ts
import type { NextFunction, Request, Response } from "express";
import { ErrorHttp } from "../errores.js";

// Middleware de errores: Express lo reconoce porque recibe 4 parámetros.
export function manejarErrores(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ErrorHttp) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  console.error(err);
  // US-00, camino alternativo 3: error de conexión con la base de datos
  res.status(500).json({
    error: "No se pudieron guardar los datos. Contacte al equipo técnico.",
  });
}
```

**`src/index.ts`**

```ts
import cors from "cors";
import express from "express";
import { manejarErrores } from "./middlewares/manejarErrores.js";
import { aeropuertoRutas } from "./rutas/aeropuertoRutas.js";

const app = express();

app.use(cors({ origin: "http://localhost:3000" })); // permite llamadas desde el frontend
app.use(express.json());                            // convierte el body JSON en objeto

app.get("/api/salud", (_req, res) => {
  res.json({ ok: true });
});
app.use("/api/aeropuertos", aeropuertoRutas);

app.use(manejarErrores); // siempre al final

const PUERTO = Number(process.env.PORT ?? 4000);
app.listen(PUERTO, () => {
  console.log(`API escuchando en http://localhost:${PUERTO}`);
});
```

Probar sin frontend:

```bash
npm run dev
curl -X POST http://localhost:4000/api/aeropuertos \
  -H "Content-Type: application/json" \
  -d '{"codigo":"bhi","nombre":"Comandante Espora","ciudad":"Bahía Blanca"}'
# → 201 {"id_aeropuerto":1,"codigo":"BHI","nombre":"Comandante Espora","ciudad":"Bahía Blanca","pais":"Argentina"}
# Repetirlo → 409 {"error":"Ya existe un aeropuerto con ese código"}
```

(También se puede probar con extensiones como *Thunder Client* / *REST Client* de VS Code, o Postman.)

### 9.3 Frontend

**`lib/tipos.ts`**

```ts
// Tipos compartidos por todo el frontend (reflejan lo que devuelve el backend).
export interface Aeropuerto {
  id_aeropuerto: number;
  codigo: string;
  nombre: string;
  ciudad: string;
  pais: string;
}

export type AeropuertoNuevo = Pick<Aeropuerto, "codigo" | "nombre" | "ciudad">;
```

**`lib/api.ts`**

```ts
import type { Aeropuerto, AeropuertoNuevo } from "./tipos";

// NEXT_PUBLIC_ => la variable también está disponible en el navegador.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function obtenerAeropuertos(): Promise<Aeropuerto[]> {
  const res = await fetch(`${API_URL}/api/aeropuertos`, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudieron obtener los aeropuertos");
  return res.json();
}

export async function crearAeropuerto(datos: AeropuertoNuevo): Promise<Aeropuerto> {
  const res = await fetch(`${API_URL}/api/aeropuertos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  const cuerpo = await res.json();
  if (!res.ok) {
    // El backend devuelve { error: "..." } en 400, 409 y 500
    throw new Error(cuerpo.error ?? "Error desconocido");
  }
  return cuerpo;
}
```

**`app/admin/aeropuertos/page.tsx`** (Server Component: lista)

```tsx
import Link from "next/link";
import { obtenerAeropuertos } from "@/lib/api";

// Server Component (por defecto): corre en el servidor, puede ser async.
export default async function AeropuertosPage() {
  const aeropuertos = await obtenerAeropuertos();

  return (
    <main className="p-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Gestión de aeropuertos</h1>
        <Link
          href="/admin/aeropuertos/nuevo"
          className="rounded bg-blue-600 px-4 py-2 text-white"
        >
          Nuevo aeropuerto
        </Link>
      </div>

      {aeropuertos.length === 0 ? (
        <p>No hay aeropuertos cargados.</p>
      ) : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2">Código</th>
              <th className="p-2">Nombre</th>
              <th className="p-2">Ciudad</th>
            </tr>
          </thead>
          <tbody>
            {aeropuertos.map((a) => (
              <tr key={a.id_aeropuerto} className="border-t">
                <td className="p-2">{a.codigo}</td>
                <td className="p-2">{a.nombre}</td>
                <td className="p-2">{a.ciudad}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
```

**`app/admin/aeropuertos/nuevo/page.tsx`** (Server Component que contiene el formulario)

```tsx
import FormularioAeropuerto from "@/components/FormularioAeropuerto";

export default function NuevoAeropuertoPage() {
  return (
    <main className="p-8 max-w-md">
      <h1 className="text-2xl font-bold mb-4">Nuevo aeropuerto</h1>
      <FormularioAeropuerto />
    </main>
  );
}
```

**`components/FormularioAeropuerto.tsx`** (Client Component: estado y eventos)

```tsx
"use client"; // Client Component: usa estado y eventos, corre en el navegador.

import { useRouter } from "next/navigation";
import { useState } from "react";
import { crearAeropuerto } from "@/lib/api";
import type { AeropuertoNuevo } from "@/lib/tipos";

const VACIO: AeropuertoNuevo = { codigo: "", nombre: "", ciudad: "" };

export default function FormularioAeropuerto() {
  const router = useRouter();
  const [datos, setDatos] = useState<AeropuertoNuevo>(VACIO);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  // "Guardar" se habilita solo si los tres campos tienen algo escrito.
  const completo = Object.values(datos).every((v) => v.trim() !== "");

  function cambiar(e: React.ChangeEvent<HTMLInputElement>) {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  }

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); // evita que el navegador recargue la página
    setGuardando(true);
    setError(null);
    try {
      await crearAeropuerto(datos);
      alert("Aeropuerto creado correctamente");
      router.push("/admin/aeropuertos");
      router.refresh(); // vuelve a pedir los datos del Server Component
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setGuardando(false);
    }
  }

  const campos: { name: keyof AeropuertoNuevo; label: string }[] = [
    { name: "codigo", label: "Código" },
    { name: "nombre", label: "Nombre" },
    { name: "ciudad", label: "Ciudad" },
  ];

  return (
    <form onSubmit={enviar} className="flex flex-col gap-3">
      {campos.map(({ name, label }) => (
        <label key={name} className="flex flex-col">
          {label}
          <input
            name={name}
            value={datos[name]}
            onChange={cambiar}
            className={`border p-2 rounded ${
              datos[name].trim() === "" ? "border-red-500" : "border-gray-300"
            }`}
          />
        </label>
      ))}

      {error && <p className="text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={!completo || guardando}
        className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
      >
        {guardando ? "Guardando..." : "Guardar"}
      </button>
    </form>
  );
}
```

Puntos para entender de este componente:
- `keyof AeropuertoNuevo` = `"codigo" | "nombre" | "ciudad"`: TS garantiza que `datos[name]` existe.
- `[e.target.name]: e.target.value` es una **propiedad computada**: actualiza el campo cuyo `name` disparó el evento.
- `disabled={!completo || guardando}` cumple el camino alternativo 1 de la US.

### 9.4 Correr todo

```bash
# Terminal 1
cd backend && npm run dev      # http://localhost:4000

# Terminal 2
cd frontend && npm run dev     # http://localhost:3000/admin/aeropuertos
```

---

## 10. Modelado de las entidades de AR-Jet

Traducción a TypeScript de `Entidades-BD.docx` y del Diagrama ER (los nombres finales los define el equipo junto con la comisión analista):

```ts
// lib/tipos.ts (frontend) o src/modelos/*.ts (backend)

export type Clase = "Economy" | "Primera";
export type EstadoViaje = "Programado" | "En vuelo" | "Aterrizado" | "Demorado" | "Cancelado";
export type EstadoCompra = "Pendiente" | "Pagada" | "Cancelada" | "Vencida";
export type DiaSemana = "lunes" | "martes" | "miercoles" | "jueves" | "viernes" | "sabado" | "domingo";

export interface Aeropuerto {
  id_aeropuerto: number;
  codigo: string;
  nombre: string;
  ciudad: string;
  pais: string;
}

export interface Avion {
  id_avion: number;
  matricula: string;
  modelo: string;
  capacidad_economy: number;
  capacidad_primera: number;
}

// Vuelo = la "plantilla" (ruta, días, horarios, período de venta, precios)
export interface Vuelo {
  id_vuelo: number;
  origen: number;            // FK → Aeropuerto
  destino: number;           // FK → Aeropuerto
  dias_operacion: DiaSemana[];
  hora_partida: string;      // "08:30"
  hora_llegada: string;
  inicio_disp: string;       // fecha ISO "2026-12-01"
  fin_disp: string;
  precio_economy: number;
  precio_primera: number;
}

// Viaje = una salida concreta de un vuelo en una fecha
export interface Viaje {
  id_viaje: number;
  id_vuelo: number;
  id_avion: number;
  fecha_partida: string;     // ISO con hora
  fecha_llegada: string;
  estado: EstadoViaje;
}

export interface Pasajero {
  dni: string;
  nombre: string;
  apellido: string;
}

export interface Pago {
  cod_compra: number;
  factura: string | null;
  tipo: string;
  estado_compra: EstadoCompra;
}

export interface Pasaje {
  id_pasaje: number;
  id_viaje: number;
  cod_compra: number;
  dni_pasajero: string;
  clase: Clase;
  asiento: string | null;
}
```

Ejemplo de SQL equivalente para `avion` y `vuelo`:

```sql
CREATE TABLE avion (
  id_avion          SERIAL PRIMARY KEY,
  matricula         VARCHAR(10) NOT NULL UNIQUE,
  modelo            VARCHAR(50) NOT NULL,
  capacidad_economy INTEGER NOT NULL CHECK (capacidad_economy >= 0),
  capacidad_primera INTEGER NOT NULL CHECK (capacidad_primera >= 0),
  activo            BOOLEAN NOT NULL DEFAULT TRUE      -- baja lógica (US-04)
);

CREATE TABLE vuelo (
  id_vuelo       SERIAL PRIMARY KEY,
  origen         INTEGER NOT NULL REFERENCES aeropuerto(id_aeropuerto),
  destino        INTEGER NOT NULL REFERENCES aeropuerto(id_aeropuerto),
  dias_operacion TEXT[]  NOT NULL,
  hora_partida   TIME    NOT NULL,
  hora_llegada   TIME    NOT NULL,
  inicio_disp    DATE    NOT NULL,
  fin_disp       DATE    NOT NULL,
  precio_economy NUMERIC(12,2) NOT NULL CHECK (precio_economy > 0),
  precio_primera NUMERIC(12,2) NOT NULL CHECK (precio_primera > 0),
  CHECK (origen <> destino),
  CHECK (fin_disp >= inicio_disp)
);
```

> **Ojo con tipos de PostgreSQL en `pg`:** `NUMERIC` llega a JS como **string** (para no perder precisión) y `DATE`/`TIMESTAMP` como objetos `Date`. Convertí con `Number(...)` cuando haga falta, o definí los tipos TS acordes.

---

## 11. Autenticación y roles

El enunciado pide tres tipos de usuario. Panorama de cómo se resuelve (detalle a definir con la comisión analista):

1. **Registro:** la contraseña **nunca** se guarda en texto plano. Se guarda un *hash* con `bcrypt` o `argon2`:
   ```ts
   import bcrypt from "bcrypt";
   const hash = await bcrypt.hash(contrasenia, 10);        // al registrar
   const ok = await bcrypt.compare(intento, hashGuardado);  // al iniciar sesión
   ```
2. **Login:** `POST /api/auth/login` verifica DNI + contraseña y responde con un **token** (por ejemplo un JWT firmado) en una **cookie `httpOnly`** (el JavaScript del navegador no puede leerla, lo que protege contra robo de sesión).
3. **Backend:** un middleware lee el token, obtiene `{ dni, rol }` y lo deja en el request; otro middleware verifica el rol:
   ```ts
   function requiereRol(...roles: Rol[]) {
     return (req: Request, res: Response, next: NextFunction) => {
       const usuario = res.locals.usuario as { rol: Rol } | undefined;
       if (!usuario) return res.status(401).json({ error: "No autenticado" });
       if (!roles.includes(usuario.rol)) return res.status(403).json({ error: "Sin permiso" });
       next();
     };
   }
   aeropuertoRutas.post("/", requiereRol("administrador"), controlador.crear);
   ```
4. **Frontend:** `proxy.ts` redirige a `/login` si no hay sesión (sección 7.8) y cada layout (`admin/`, `mostrador/`, `(pasajero)/`) muestra el menú correspondiente.

> La seguridad real **siempre** se valida en el backend. Ocultar un botón en el frontend no impide que alguien llame a la API directamente.

Para no reinventar todo, existen librerías como **Auth.js** o **Better Auth**; evalúenlas en equipo antes de empezar las US de login.

---

## 12. Buenas prácticas, errores comunes y glosario

### 12.1 Buenas prácticas

- **Una User Story = una rama = un PR.** Nombre: `feature/US-00-alta-aeropuertos`.
- Antes de pushear: `npm run lint` y `npm run build` (frontend) / `npm run typecheck` (backend).
- **Nunca** `any`. Si no sabés el tipo, `unknown` + verificación.
- Validá en el backend **siempre**; en el frontend es solo para mejor experiencia.
- Mensajes de error y textos: **exactamente** los que figuran en las User Stories (la comisión analista los va a verificar en la demo).
- Un componente por archivo, nombre en PascalCase (`FormularioAeropuerto.tsx`); funciones y variables en camelCase (`crearAeropuerto`); constantes globales en MAYÚSCULAS (`MAX_PASAJES`).
- Server Components por defecto; `"use client"` solo donde hay interactividad.
- Secretos en `.env` / `.env.local`; actualizar `.env.example` cuando agregues una variable nueva (sin el valor real).

### 12.2 Errores comunes y su solución

| Error | Causa | Solución |
|---|---|---|
| `useState is not a function` / *"You're importing a component that needs useState..."* | Usaste un hook en un Server Component | Agregá `"use client"` arriba del archivo (o separá esa parte en otro componente). |
| `Cannot find module '@/lib/api'` | Ruta o alias mal escrito | Verificá que el archivo exista y que `tsconfig.json` tenga `"@/*": ["./*"]`. |
| `params.id` es `undefined` o error de tipo | En Next.js 15+ `params` es Promise | `const { id } = await props.params;` |
| *Hydration failed* | El HTML del servidor y del navegador difieren (ej. `Date.now()`, `Math.random()`, `window` en el render) | Mové ese código a `useEffect` o a un Client Component. |
| `Access-Control-Allow-Origin` (CORS) | El backend no permite el origen del frontend | `app.use(cors({ origin: "http://localhost:3000" }))`. |
| `ECONNREFUSED` en `fetch` | El backend no está corriendo o el puerto es otro | Levantá `npm run dev` en `backend/` y revisá `NEXT_PUBLIC_API_URL`. |
| `'x' is possibly 'undefined'` | `strict` te avisa de un caso no contemplado | Usá `if (x)`, `x?.prop` o `x ?? valorPorDefecto`. |
| `Module not found` tras `git pull` | Un compañero agregó dependencias | `npm install`. |
| `Each child in a list should have a unique "key"` | Falta `key` en un `.map()` | `<li key={item.id}>`. |
| `Falta la variable de entorno DATABASE_URL` | No existe `backend/.env` | Copiá `.env.example` a `.env` y completalo. |
| Tutorial usa `pages/`, `getServerSideProps`, `next/router` | Es del **Pages Router** (sistema viejo) | Buscá la versión **App Router** de ese tema. |
| Tutorial usa `middleware.ts` | Next.js ≤ 15 | En Next.js 16 es `proxy.ts` con `export function proxy`. |

### 12.3 Glosario

| Término | Definición |
|---|---|
| **App Router** | Sistema de rutas de Next.js basado en la carpeta `app/`. El actual. |
| **Pages Router** | Sistema anterior basado en `pages/`. No lo mezclen. |
| **Build** | Compilar la app para producción (`npm run build`). |
| **Componente** | Función que devuelve JSX; pieza reutilizable de interfaz. |
| **CORS** | Regla del navegador que impide llamar a otro dominio/puerto salvo que el servidor lo permita. |
| **Endpoint** | Combinación método + URL de la API (ej. `POST /api/aeropuertos`). |
| **Hook** | Función de React que empieza con `use` (`useState`, `useEffect`, `useRouter`). |
| **Hidratación** | Cuando React "activa" en el navegador el HTML que vino del servidor. |
| **JSX / TSX** | Sintaxis tipo HTML dentro de JS/TS. |
| **Middleware** | Función intermedia en la cadena de un request (Express) / en Next.js 16 se llama Proxy. |
| **Props** | Parámetros que recibe un componente. |
| **Render** | Que React calcule y dibuje la interfaz. |
| **Server Action** | Función `"use server"` invocable desde un formulario. |
| **SSR** | *Server-Side Rendering*: generar el HTML en el servidor. |
| **Estado (state)** | Datos de un componente que, al cambiar, lo vuelven a dibujar. |
| **Tipado estático** | Verificación de tipos al escribir/compilar, no al ejecutar. |

### 12.4 Recursos oficiales

- Next.js (App Router): https://nextjs.org/docs — también vienen incluidos en el proyecto en `node_modules/next/dist/docs/`, en la versión exacta que tienen instalada.
- Curso oficial gratuito de Next.js: https://nextjs.org/learn
- React: https://react.dev/learn
- TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/intro.html
- Express 5: https://expressjs.com
- node-postgres (`pg`): https://node-postgres.com
- Zod: https://zod.dev
- Tailwind CSS: https://tailwindcss.com/docs
- Neon: https://neon.tech/docs

### 12.5 Ruta de aprendizaje sugerida

1. Sección 4 (TypeScript) con un archivo `practica.ts` y `npx tsx practica.ts`.
2. https://react.dev/learn (los primeros capítulos: componentes, props, estado).
3. Crear el proyecto Next.js y reproducir la sección 9 completa.
4. Implementar US-01 (baja) y US-02 (modificación) de aeropuertos copiando el patrón.
5. Recién después: autenticación, compra de pasajes, emails, reportes.

> Con Claude en la nube (ver Guía 1) podés pedir: *"Explicame este archivo línea por línea"* o *"Implementá la US-01 siguiendo el patrón de la US-00 y explicame cada paso"*: usalo como tutor, no solo para generar código.
