// Validación compartida entre el formulario (cliente) y las server actions.

export type DatosAeropuerto = {
  codigo: string;
  nombre: string;
  ciudad: string;
  pais: string;
  direccion: string;
};

export type ErroresAeropuerto = Partial<Record<keyof DatosAeropuerto, string>>;

export const LARGO_MAXIMO = {
  codigo: 3,
  nombre: 150,
  ciudad: 100,
  pais: 100,
  direccion: 200,
} as const;

export function normalizarAeropuerto(datos: DatosAeropuerto): DatosAeropuerto {
  return {
    codigo: datos.codigo.trim().toUpperCase(),
    nombre: datos.nombre.trim(),
    ciudad: datos.ciudad.trim(),
    pais: datos.pais.trim(),
    direccion: datos.direccion.trim(),
  };
}

export function validarAeropuerto(datos: DatosAeropuerto): ErroresAeropuerto {
  const normalizados = normalizarAeropuerto(datos);
  const errores: ErroresAeropuerto = {};

  if (!normalizados.codigo) {
    errores.codigo = "El código es obligatorio";
  } else if (!/^[A-Z]{3}$/.test(normalizados.codigo)) {
    errores.codigo = "El código IATA debe tener 3 letras";
  }

  validarTexto(normalizados, errores, "nombre", "El nombre es obligatorio");
  validarTexto(normalizados, errores, "ciudad", "La ciudad es obligatoria");
  validarTexto(normalizados, errores, "pais", "El país es obligatorio");
  validarTexto(normalizados, errores, "direccion", "La dirección es obligatoria");

  return errores;
}

function validarTexto(
  datos: DatosAeropuerto,
  errores: ErroresAeropuerto,
  campo: Exclude<keyof DatosAeropuerto, "codigo">,
  mensajeObligatorio: string,
) {
  if (!datos[campo]) {
    errores[campo] = mensajeObligatorio;
  } else if (datos[campo].length > LARGO_MAXIMO[campo]) {
    errores[campo] = `Máximo ${LARGO_MAXIMO[campo]} caracteres`;
  }
}

export function tieneErrores(errores: ErroresAeropuerto) {
  return Object.keys(errores).length > 0;
}
