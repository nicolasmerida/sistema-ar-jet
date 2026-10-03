<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Instrucciones
- Modularizar bien la UI para asi no tener page.tsx de muchas lineas, siempre tratar de crear una carpeta /ui donde se meten diferentes componentes que se usan en los page.tsx de cada pagina. Ejemplo si tengo /dashboard/aviones, tener un ui/dashboard/aviones donde vayan los componentes que se usen en la page.tsx correspondiente a aviones.
- Usar el contexto en "docs\contexto" para trabajar.
- Usar la carpeta lib para el backend. Cada .ts que tenga que ver con el backend debe ir ahi.