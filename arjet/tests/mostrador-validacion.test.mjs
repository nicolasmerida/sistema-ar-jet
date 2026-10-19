import assert from "node:assert/strict";
import { test } from "node:test";
import { cargar } from "./modulos.mjs";

const tipos = cargar("lib/mostrador/tipos.ts");
const modulo = cargar("lib/mostrador/validacion.ts", { "./tipos": tipos });
const { normalizarDni } = modulo;
// Los módulos se ejecutan en un contexto aislado (vm): se aplanan los objetos para compararlos.
const validarBusqueda = (...args) => JSON.parse(JSON.stringify(modulo.validarBusqueda(...args)));

test("rechaza un valor vacío o con solo espacios y marca el campo", () => {
  for (const valor of ["", "   ", undefined, null, 5]) {
    const r = validarBusqueda("dni", valor, "pendientes");
    assert.equal(r.ok, false);
    assert.equal(r.campo, "valor");
    assert.equal(r.mensaje, "Ingresá un valor para buscar");
  }
});

test("rechaza criterios y filtros desconocidos", () => {
  assert.equal(validarBusqueda("telefono", "123", "todas").campo, "criterio");
  assert.equal(validarBusqueda("dni", "30123456", "otros").campo, "criterio");
});

test("DNI: ignora puntos, espacios y guiones, y valida largo", () => {
  assert.equal(normalizarDni(" 30.123-456 "), "30123456");
  const ok = validarBusqueda("dni", "30.123.456", "todas");
  assert.deepEqual(ok, { ok: true, busqueda: { criterio: "dni", dni: "30123456", filtro: "todas" } });
  assert.equal(validarBusqueda("dni", "123", "todas").ok, false);
  assert.equal(validarBusqueda("dni", "30'; DROP", "todas").ok, false);
});

test("código: acepta 1024, RES-1024 y res1024; rechaza texto y cero", () => {
  for (const valor of ["1024", "RES-1024", "res1024"]) {
    assert.deepEqual(validarBusqueda("codigo", valor, "pendientes"), { ok: true, busqueda: { criterio: "codigo", codigo: 1024, filtro: "pendientes" } });
  }
  for (const valor of ["abc", "0", "-5", "10.5", "99999999999"]) assert.equal(validarBusqueda("codigo", valor, "todas").ok, false);
});

test("nombre: separa palabras y limita la cantidad", () => {
  assert.deepEqual(validarBusqueda("nombre", "  Juan   Pérez ", "todas"), { ok: true, busqueda: { criterio: "nombre", palabras: ["Juan", "Pérez"], filtro: "todas" } });
  assert.equal(validarBusqueda("nombre", "a b c d e", "todas").ok, false);
  assert.equal(validarBusqueda("nombre", "x".repeat(101), "todas").ok, false);
});
