export type DatosAvion = {
  matricula: string;
  modelo: string;
  capacidadEconomy: string;
  capacidadPrimera: string;
};

export type ErroresAvion = Partial<Record<keyof DatosAvion, string>>;

export function validarAvion(datos: DatosAvion): ErroresAvion {
  const errores: ErroresAvion = {};
  if (!datos.matricula.trim()) errores.matricula = "La matrícula es obligatoria";
  if (!datos.modelo.trim()) errores.modelo = "El modelo es obligatorio";
  for (const campo of ["capacidadEconomy", "capacidadPrimera"] as const) {
    const valor = datos[campo].trim();
    if (!valor) errores[campo] = "La capacidad es obligatoria";
    else if (!/^\d+$/.test(valor) || !Number.isSafeInteger(Number(valor)) || Number(valor) > 2147483647)
      errores[campo] = "La capacidad debe ser un entero no negativo válido";
  }
  return errores;
}
