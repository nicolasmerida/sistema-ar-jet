import {
  clerkClient,
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ROL_POR_DEFECTO, RUTA_POR_ROL } from "@/lib/usuarios/tipos";

const isNeutral = createRouteMatcher(["/ingreso", "/completar-perfil"]);
const isDashboard = createRouteMatcher(["/dashboard(.*)"]);
const isMostrador = createRouteMatcher(["/mostrador(.*)"]);
const isVuelos = createRouteMatcher(["/vuelos(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const esRutaConRol =
    isNeutral(req) || isDashboard(req) || isMostrador(req) || isVuelos(req);
  if (!esRutaConRol) return;

  const { userId } = await auth.protect();
  if (isNeutral(req)) return;

  const client = await clerkClient();
  const usuario = await client.users.getUser(userId);
  const rol = (usuario.publicMetadata.role as string | undefined) ?? ROL_POR_DEFECTO;
  const rutaPropia = RUTA_POR_ROL[rol] ?? RUTA_POR_ROL[ROL_POR_DEFECTO];

  if (isDashboard(req) && rol !== "administrador") {
    return NextResponse.redirect(new URL(rutaPropia, req.url));
  }
  if (isMostrador(req) && rol !== "empleado") {
    return NextResponse.redirect(new URL(rutaPropia, req.url));
  }
  if (isVuelos(req) && rol !== ROL_POR_DEFECTO) {
    return NextResponse.redirect(new URL(rutaPropia, req.url));
  }
});

export const config = {
  matcher: [
    "/((?!_next|.*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico)).*)",
    "/(api|trpc)(.*)",
  ],
};
