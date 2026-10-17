// Validación compartida entre el formulario (cliente) y la server action.

export type DatosPerfil = {
  dni: string;
};

export type ErroresPerfil = Partial<Record<keyof DatosPerfil, string>>;

export function validarPerfil(datos: DatosPerfil): ErroresPerfil {
  const errores: ErroresPerfil = {};
  const dni = datos.dni.trim();

  if (!dni) {
    errores.dni = "El documento es obligatorio";
  } else if (!/^[A-Za-z0-9]{6,20}$/.test(dni)) {
    errores.dni = "El documento debe tener entre 6 y 20 caracteres alfanuméricos";
  }

  return errores;
}
