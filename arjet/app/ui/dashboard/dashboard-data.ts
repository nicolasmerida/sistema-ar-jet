import {
  CalendarClock,
  Clock3,
  MapPin,
  Plane,
  PlaneTakeoff,
  XCircle,
} from "lucide-react";

export const navigationItems = [
  { label: "Inicio", href: "/", icon: CalendarClock, active: true },
  { label: "Vuelos", href: "/vuelos", icon: PlaneTakeoff },
  { label: "Aeropuertos", href: "/aeropuertos", icon: MapPin },
  { label: "Aviones", href: "/aviones", icon: Plane },
];

export const summaryCards = [
  {
    label: "Vuelos programados",
    value: "12",
    icon: CalendarClock,
    tone: "primary",
  },
  {
    label: "Próximas salidas",
    value: "4",
    icon: Clock3,
    tone: "secondary",
  },
  {
    label: "Vuelos cancelados",
    value: "1",
    icon: XCircle,
    tone: "danger",
  },
];

export const todaysFlights = [
  {
    flight: "AN 101",
    route: "EZE -> COR",
    departure: "08:20",
    status: "Programado",
  },
  {
    flight: "AN 204",
    route: "AEP -> MDZ",
    departure: "11:00",
    status: "Programado",
  },
  {
    flight: "AN 310",
    route: "EZE -> BRC",
    departure: "14:30",
    status: "Cancelado",
  },
  {
    flight: "AN 118",
    route: "COR -> AEP",
    departure: "18:10",
    status: "Programado",
  },
];
