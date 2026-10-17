import { ETIQUETA_ROL, type UsuarioListado } from "@/lib/usuarios/tipos";

export function UsuariosTable({ usuarios, hayBusqueda, miClerkId, onCambiarRol, onDarDeBaja }: {
  usuarios: UsuarioListado[];
  hayBusqueda: boolean;
  miClerkId: string;
  onCambiarRol: (usuario: UsuarioListado) => void;
  onDarDeBaja: (usuario: UsuarioListado) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-background shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-left text-sm">
          <thead><tr className="border-b border-zinc-200 bg-tertiary text-xs text-zinc-500">
            {["Nombre", "Email", "DNI", "Rol", "Estado", "Acciones"].map((label) => <th key={label} scope="col" className={`px-5 py-3 font-semibold ${label === "Acciones" ? "text-right" : ""}`}>{label}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-zinc-200">
            {usuarios.length === 0 ? <tr><td colSpan={6} className="px-5 py-12 text-center text-zinc-500">{hayBusqueda ? "No hay usuarios que coincidan con la búsqueda." : "Todavía no hay usuarios registrados."}</td></tr> : usuarios.map((usuario) => {
              const soyYo = usuario.clerkId === miClerkId;
              return (
                <tr key={usuario.clerkId} className="hover:bg-tertiary/60">
                  <td className="px-5 py-4 font-medium">{usuario.nombre} {usuario.apellido}{soyYo && <span className="ml-2 text-xs font-normal text-zinc-500">(vos)</span>}</td>
                  <td className="px-5 py-4">{usuario.email}</td>
                  <td className="px-5 py-4 font-mono">{usuario.dni ?? <span className="font-sans text-xs text-zinc-500">Perfil sin completar</span>}</td>
                  <td className="px-5 py-4"><span className="inline-flex rounded-md bg-tertiary px-2.5 py-1 text-xs font-medium text-zinc-600">{ETIQUETA_ROL[usuario.rol]}</span></td>
                  <td className="px-5 py-4"><span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-medium ${usuario.baneado ? "bg-red-50 text-red-700" : "bg-primary/15 text-primary-foreground"}`}>{usuario.baneado ? "Baneado" : "Activo"}</span></td>
                  <td className="px-5 py-4"><div className="flex justify-end gap-4">
                    <button type="button" disabled={soyYo} onClick={() => onCambiarRol(usuario)} aria-label={`Cambiar rol de ${usuario.nombre} ${usuario.apellido}`} className="font-medium text-secondary underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-zinc-300 disabled:no-underline">Cambiar rol</button>
                    {usuario.baneado ? (
                      <span className="text-zinc-400">Dado de baja</span>
                    ) : (
                      <button type="button" disabled={soyYo} onClick={() => onDarDeBaja(usuario)} aria-label={`Dar de baja a ${usuario.nombre} ${usuario.apellido}`} className="font-medium text-red-600 underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-zinc-300 disabled:no-underline">Dar de baja</button>
                    )}
                  </div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
