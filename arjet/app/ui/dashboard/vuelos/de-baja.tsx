/** "BHI (de baja)": marca un aeropuerto o avión dado de baja dentro de un vuelo. */
export function DeBaja({ texto, deBaja, tipo }: { texto: string; deBaja: boolean; tipo: "aeropuerto" | "avión" }) {
  if (!deBaja) return <>{texto}</>;
  return (
    <span title={`${tipo === "aeropuerto" ? "El aeropuerto" : "El avión"} está dado de baja`} className="cursor-help">
      {texto} <span className="text-xs font-medium text-zinc-500">(de baja)</span>
    </span>
  );
}
