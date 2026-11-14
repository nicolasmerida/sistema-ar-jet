import { currentUser } from "@clerk/nextjs/server";
import { ROL_POR_DEFECTO } from "@/lib/usuarios/tipos";
import { obtenerArchivoPrivado } from "@/lib/documentos/data";

export const runtime = "nodejs";
const sinCache = { "Cache-Control": "private, no-store" };

export async function GET(_request: Request, { params }: RouteContext<"/vuelos/compras/documentos/[id]">) {
  try {
    const usuario = await currentUser();
    if (!usuario || usuario.banned || (usuario.publicMetadata.role ?? ROL_POR_DEFECTO) !== ROL_POR_DEFECTO) return Response.json({ mensaje: "No tiene permisos para acceder a esta sección" }, { status: 403, headers: sinCache });
    const { id } = await params;
    if (!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id)) return Response.json({ mensaje: "No tiene permisos para acceder a esta sección" }, { status: 403, headers: sinCache });
    const archivo = await obtenerArchivoPrivado(id, usuario.id);
    if (!archivo) return Response.json({ mensaje: "No tiene permisos para acceder a esta sección" }, { status: 403, headers: sinCache });
    if (!archivo.pdf || !archivo.emitido_en) return Response.json({ mensaje: "La documentación todavía está pendiente" }, { status: 409, headers: sinCache });
    const nombre = `${archivo.tipo}-${archivo.numero}`.replace(/[^a-zA-Z0-9-]/g, "_");
    return new Response(new Uint8Array(archivo.pdf), { headers: {
      ...sinCache, "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${nombre}.pdf"`, "X-Content-Type-Options": "nosniff",
    } });
  } catch { return Response.json({ mensaje: "No se pudo descargar la documentación. Por favor, reintentá más tarde." }, { status: 503, headers: sinCache }); }
}
