@AGENTS.md

## Instrucciones
- Modularizar bien la UI para asi no tener page.tsx de muchas lineas, siempre tratar de crear una carpeta /ui donde se meten diferentes componentes que se usan en los page.tsx de cada pagina. Ejemplo si tengo /dashboard/aviones, tener un ui/dashboard/aviones donde vayan los componentes que se usen en la page.tsx correspondiente a aviones.
- Usar el contexto en "docs\contexto" para trabajar.
- Usar la carpeta lib para el backend. Cada .ts que tenga que ver con el backend debe ir ahi.