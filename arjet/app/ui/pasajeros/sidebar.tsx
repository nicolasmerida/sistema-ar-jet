import { MenuLateral } from "@/app/ui/menu-lateral";
import { NavLinksPasajero } from "./nav-links";

export function SidebarPasajero() {
  return (
    <MenuLateral etiqueta="Menú de pasajeros">
      <NavLinksPasajero />
    </MenuLateral>
  );
}
