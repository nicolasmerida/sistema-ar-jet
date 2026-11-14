import { MenuLateral } from "../menu-lateral";
import { NavLinks } from "./nav-links";

export function Sidebar() {
  return (
    <MenuLateral etiqueta="Menú principal">
      <NavLinks />
    </MenuLateral>
  );
}
