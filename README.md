# Sistema AR-Jet

Sistema de gestión para la aerolínea AR-Jet — Proyecto cuatrimestral de **Proyectos de Software (PSS) 2026**, DCIC - UNS.
Implementado por la **Comisión 10**.

## Estructura del repositorio

```
.
├── frontend/                 # Aplicación cliente (Next.js)
├── backend/                  # API / lógica de negocio / acceso a datos (TypeScript + JavaScript)
└── docs/
    ├── enunciado/            # Enunciado oficial del proyecto (PSS 2026)
    └── comision-analista/    # Documentos que nos entrega la comisión analista
```

## Cómo trabajar

1. Clonar el repo: `git clone https://github.com/nicolasmerida/sistema-ar-jet.git`
2. Crear una rama por tarea/US: `git checkout -b feature/US-XX-descripcion`
3. Commits chicos y descriptivos.
4. Abrir un Pull Request hacia `main` y pedir revisión a otro integrante.
5. No pushear directo a `main`.

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | [Next.js](https://nextjs.org/) |
| Backend | [Node.js](https://nodejs.org/) con TypeScript y JavaScript |
| Base de datos | PostgreSQL alojado en [Neon](https://neon.tech/) |

> Las credenciales de la base (connection string de Neon) **nunca** se suben al repo: van en un archivo `.env` local, que ya está en el `.gitignore`. Ver `backend/.env.example`.
