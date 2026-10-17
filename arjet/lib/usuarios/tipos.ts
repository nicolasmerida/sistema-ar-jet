import type { ErroresPerfil } from "./validacion";

export type ResultadoAccionPerfil =
  | { ok: true }
  | { ok: false; mensaje: string; errores?: ErroresPerfil };

export type ResultadoAccionUsuario =
  | { ok: true; mensaje: string }
  | { ok: false; mensaje: string };

export const ROL_POR_DEFECTO = "cliente";

export const RUTA_POR_ROL: Record<string, string> = {
  administrador: "/dashboard",
  empleado: "/mostrador",
  cliente: "/vuelos",
};

export const ROLES_VALIDOS = ["cliente", "empleado", "administrador"] as const;
export type Rol = (typeof ROLES_VALIDOS)[number];

export const ETIQUETA_ROL: Record<Rol, string> = {
  cliente: "Cliente",
  empleado: "Empleado",
  administrador: "Administrador",
};

export type UsuarioListado = {
  clerkId: string;
  nombre: string;
  apellido: string;
  email: string;
  dni: string | null;
  rol: Rol;
  baneado: boolean;
};
