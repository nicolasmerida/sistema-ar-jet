export type AvionListado = {
  id: number;
  matricula: string;
  modelo: string;
  capacidadEconomy: number;
  capacidadPrimera: number;
  vuelosVigentes: number;
};

// Datos para previsualizar la interfaz; no representan registros de Neon.
export const avionesEjemplo: AvionListado[] = [
  { id: 1, matricula: "LV-FRT", modelo: "Airbus A320", capacidadEconomy: 150, capacidadPrimera: 12, vuelosVigentes: 2 },
  { id: 2, matricula: "LV-NEW", modelo: "Boeing 737-800", capacidadEconomy: 162, capacidadPrimera: 16, vuelosVigentes: 0 },
];
