This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Database (Prisma 7)

Set `DATABASE_URL` in `.env` to your Neon PostgreSQL connection string.
Optionally set `DIRECT_URL` for CLI operations; otherwise they use `DATABASE_URL`.
Configure the same variables in Vercel for the environments you deploy to.

```bash
npm run db:pull
npm run db:generate
```

`db:pull` reads existing tables into `prisma/schema.prisma` without changing them.
The generated client lives in `src/generated/prisma` and is excluded from Git.
`npm install` regenerates it through `postinstall`.

Import the shared client only from server-side code:

```ts
import { db } from "@/src/prisma/db";
```

Existing tables have not been baselined for Prisma Migrate. Set up a baseline
before using migrations against this database.

### Campos de aviones e interfaz

Desde `arjet/`, con `.env` apuntando a la base correspondiente, sincronizar
el esquema con Neon y regenerar el cliente:

```bash
npx prisma db push
npm run db:generate
```

El modelo `avion` incluye `matricula` única y `modelo`, ambos obligatorios.
Si Prisma informa que no puede agregar campos obligatorios a registros existentes,
hay que completar sus datos reales antes de continuar. No usar un reset para resolverlo.

La pantalla `/dashboard/aviones` consulta Neon en cada petición mediante Prisma.
El alta, la edición y la baja usan Server Actions en `lib/aviones/actions.ts`,
validan nuevamente los datos en el servidor y actualizan el listado tras guardar.
La matrícula se normaliza a mayúsculas al crear y permanece fija en la edición.
La baja comprueba los viajes vigentes en la base y conserva cualquier avión con
viajes registrados para mantener el historial y respetar sus claves foráneas.
La autorización por rol administrador está pendiente del módulo de login.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
