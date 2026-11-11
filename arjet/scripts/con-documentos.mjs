import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const worker = spawn(process.execPath, ["--import", "tsx", "--conditions=react-server", "scripts/documentos-worker.ts"], { stdio: "inherit", windowsHide: true });
const servidor = spawn(process.execPath, [fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url)), ...process.argv.slice(2)], { stdio: "inherit", windowsHide: true });

let cerrando = false;
function cerrar(codigo = 0) {
  if (cerrando) return;
  cerrando = true;
  worker.kill(); servidor.kill();
  process.exitCode = codigo;
}
process.on("SIGINT", () => cerrar());
process.on("SIGTERM", () => cerrar());
servidor.on("exit", (codigo) => cerrar(codigo ?? 0));
worker.on("exit", (codigo) => { if (!cerrando) { console.error("El worker de documentos se detuvo"); cerrar(codigo || 1); } });
