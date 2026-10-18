import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

// Aísla los módulos de negocio de Clerk y de la conexión de producción.
export function cargar(ruta, dependencias = {}) {
  const fuente = readFileSync(new URL(`../${ruta}`, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(fuente, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  runInNewContext(outputText, {
    exports, Date, Intl, URL, console: { error() {} },
    require(nombre) {
      assert.ok(Object.hasOwn(dependencias, nombre), `Dependencia inesperada: ${nombre}`);
      return dependencias[nombre];
    },
  }, { filename: ruta });
  return exports;
}
