import { MenuLateral } from "../menu-lateral";
import { NavLinksMostrador } from "./nav-links";

export function SidebarMostrador() {
  return (
    <MenuLateral etiqueta="Menú del mostrador">
      <NavLinksMostrador />
    </MenuLateral>
  );
}
