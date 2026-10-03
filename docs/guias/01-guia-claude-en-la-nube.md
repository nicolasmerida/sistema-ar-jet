# Guía 1 — Cómo usar Claude Code en la nube con el repo `sistema-ar-jet`

> Guía pensada para la Comisión 10 (implementadora del Sistema AR-Jet).
> Información verificada contra la documentación oficial de Claude Code
> (`code.claude.com/docs`) en octubre de 2026. Los nombres de botones y menús
> pueden cambiar; si algo no coincide, la fuente de verdad es esa documentación.

---

## Índice

1. [Conceptos básicos: qué es "Claude en la nube"](#1-conceptos-básicos)
2. [Requisitos previos](#2-requisitos-previos)
3. [Conectar GitHub (una sola vez)](#3-conectar-github-una-sola-vez)
4. [El entorno (environment) y por qué importa para Neon](#4-el-entorno-environment)
5. [Iniciar una sesión de trabajo](#5-iniciar-una-sesión-de-trabajo)
6. [Modos de permiso](#6-modos-de-permiso)
7. [Cómo pedirle tareas a Claude (prompts que funcionan)](#7-cómo-pedirle-tareas-a-claude)
8. [Revisar los cambios y crear un Pull Request](#8-revisar-los-cambios-y-crear-un-pull-request)
9. [Git y GitHub: lo mínimo que tenés que entender](#9-git-y-github-lo-mínimo-que-tenés-que-entender)
10. [Flujo de trabajo recomendado para el equipo](#10-flujo-de-trabajo-recomendado-para-el-equipo)
11. [Usarlo desde el celular, la app de escritorio y la terminal](#11-otras-formas-de-usarlo)
12. [Auto-fix de Pull Requests](#12-auto-fix-de-pull-requests)
13. [Archivos que le dan "memoria" a Claude: `CLAUDE.md` y `.claude/`](#13-claudemd-y-la-carpeta-claude)
14. [Secretos y seguridad](#14-secretos-y-seguridad)
15. [Límites y problemas comunes](#15-límites-y-problemas-comunes)
16. [Cheat sheet](#16-cheat-sheet)

---

## 1. Conceptos básicos

| Término | Qué significa |
|---|---|
| **Claude Code** | El agente de programación de Anthropic. Lee código, ejecuta comandos, edita archivos y hace commits. |
| **Sesión en la nube (cloud session)** | Una conversación con Claude Code que corre en una **máquina virtual de Anthropic**, no en tu PC. Sigue trabajando aunque cierres el navegador. |
| **claude.ai/code** | La página web desde donde iniciás y seguís esas sesiones (también llamada *Claude Code on the web*). |
| **Repositorio (repo)** | La carpeta del proyecto con todo su historial, alojada en GitHub: `github.com/nicolasmerida/sistema-ar-jet`. |
| **Rama (branch)** | Una "línea paralela" del código. Cada tarea se hace en su propia rama para no romper `main`. |
| **Pull Request (PR)** | Pedido para fusionar (merge) una rama en `main`, donde los compañeros revisan los cambios antes de aceptarlos. |
| **Entorno (environment)** | Configuración guardada de la máquina virtual: acceso a internet, variables de entorno y script de instalación. |

### Qué pasa cuando le das una tarea

1. **Clona** el repositorio en una máquina virtual limpia.
2. Ejecuta el **script de setup** del entorno, si existe.
3. Aplica las reglas de **red** del entorno (a qué sitios puede conectarse).
4. **Trabaja**: lee archivos, edita, corre comandos (`npm install`, `npm run build`, tests…).
5. Hace **commit y push** de una rama a GitHub.
6. Vos revisás el *diff* (las diferencias), dejás comentarios y creás el PR.

La sesión **no se cierra** al pushear: podés seguir pidiéndole cambios en la misma conversación.

> Importante: la máquina virtual es **temporal**. Lo que no esté commiteado y pusheado a GitHub se pierde cuando la sesión queda inactiva un tiempo. Al reabrirla se crea una máquina nueva con el historial de la conversación, pero sin los procesos que estaban corriendo.

---

## 2. Requisitos previos

- Una cuenta de **claude.ai** con un plan que incluya sesiones en la nube: **Pro, Max o Team** (o Enterprise con asiento premium / Chat + Claude Code). El plan gratuito no incluye Claude Code.
- Una cuenta de **GitHub** con acceso al repo `nicolasmerida/sistema-ar-jet`. Para que un compañero pueda trabajar, el dueño del repo tiene que agregarlo como colaborador:
  GitHub → repo → **Settings → Collaborators → Add people**.
- Navegador actualizado. Opcional: la app móvil de Claude (iOS/Android) y/o la app de escritorio.

---

## 3. Conectar GitHub (una sola vez)

1. Entrá a **https://claude.ai/code** e iniciá sesión con tu cuenta de claude.ai.
2. Te va a pedir **conectar GitHub**. Te redirige a GitHub, aprobás la autorización y volvés.
3. **Instalá la Claude GitHub App** en el repositorio. Esto es obligatorio para repos **privados** y además habilita el *Auto-fix* de PRs:
   - https://github.com/apps/claude/installations/new
   - Elegí la cuenta `nicolasmerida` y, en *Repository access*, seleccioná `sistema-ar-jet` (o "All repositories").
   - Si el repo pertenece a una organización, puede que un dueño de la organización tenga que aprobarlo.
4. Al terminar, el onboarding crea un entorno llamado **Default** (en Pro/Max lo crea solo; en Team/Enterprise aparece un formulario *Create your first cloud environment* → dejá los valores y tocá **Create & finish**).

**Alternativa por terminal** (si ya usás la GitHub CLI `gh`):

```bash
gh auth login        # en tu shell
claude               # abre Claude Code en la terminal
/login               # dentro de Claude Code, si no estás logueado con claude.ai
/web-setup           # envía tu token de gh a tu cuenta de Claude
```

> Si no aparecen repositorios después de conectar: casi siempre es porque la Claude GitHub App no está instalada en ese repo, o no incluye ese repo en su "Repository access".

---

## 4. El entorno (environment)

El entorno controla **qué puede hacer la máquina virtual**. Se edita desde **claude.ai/code → selector de entorno (ícono de nube junto al cuadro de texto / en la barra del título de la sesión) → Edit**.

El diálogo tiene cuatro partes:

### 4.1 Network access (acceso a internet)

| Nivel | Qué permite |
|---|---|
| **None** | Nada de internet (salvo la API de Anthropic). `npm install` falla. |
| **Trusted** *(por defecto)* | Solo dominios de una lista permitida: registros de paquetes (npm, PyPI…), GitHub, SDKs de nubes, nodejs.org, Docker Hub, etc. |
| **Full** | Cualquier dominio. |
| **Custom** | Tu propia lista de dominios, opcionalmente sumando la lista por defecto. |

**Caso concreto de AR-Jet — Neon:** la base de datos de producción del proyecto está en **Neon** (`*.neon.tech`). Ese dominio **no está** en la lista *Trusted*. Si querés que Claude se conecte a la base de Neon desde la nube (por ejemplo para correr migraciones o probar la API contra datos reales), tenés que:

1. Elegir **Custom**.
2. En **Allowed domains** escribir:
   ```text
   *.neon.tech
   ```
3. Tildar **Also include default list of common package managers** (para que `npm install` siga funcionando).

Alternativa sin tocar la red: la máquina virtual trae **PostgreSQL 16 preinstalado** (apagado). Podés pedirle a Claude "levantá el PostgreSQL local con `service postgresql start` y usalo para probar". Es más seguro para pruebas porque no toca datos reales.

### 4.2 Environment variables

Formato `.env`, un `CLAVE=valor` por línea:

```env
NODE_ENV=development
DATABASE_URL=postgresql://usuario:password@host.neon.tech/base?sslmode=require
```

> **Atención:** cualquiera que use ese entorno puede **leer** estas variables. No pongas contraseñas de producción si compartís el entorno. Para pruebas, creá en Neon una **rama (branch) de base de datos** o un usuario con permisos limitados y usá esa connection string.

### 4.3 Setup script

Script Bash que corre **antes** de que arranque Claude, al crear una sesión nueva. Se usa para instalar herramientas que no vienen preinstaladas. El resultado se **cachea** (aprox. 7 días) si termina en menos de ~5 minutos, así las sesiones siguientes arrancan rápido.

Para este proyecto **no hace falta**: la máquina ya trae Node.js 20/21/22 (22 por defecto), npm, yarn, pnpm, eslint, prettier, PostgreSQL 16, Docker, Git.

Si un día lo necesitan, un ejemplo:

```bash
#!/bin/bash
set -e
cd frontend && npm ci
cd ../backend && npm ci
```

### 4.4 Setup script vs. hook `SessionStart`

| | Setup script | Hook SessionStart |
|---|---|---|
| Dónde se configura | En el diálogo del entorno (claude.ai) | En el repo: `.claude/settings.json` |
| Cuándo corre | Antes de que arranque Claude; se saltea si hay caché | Cada vez que arranca o se reanuda una sesión |
| Dónde corre | Solo en la nube | En la nube y en local |

Para tareas propias del proyecto (como `npm install`) la doc recomienda el **hook**, porque queda versionado en el repo y todo el equipo lo comparte. Ejemplo:

```json
// .claude/settings.json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume",
        "hooks": [
          { "type": "command", "command": "bash \"$CLAUDE_PROJECT_DIR\"/scripts/install_pkgs.sh" }
        ]
      }
    ]
  }
}
```

```bash
#!/bin/bash
# scripts/install_pkgs.sh — solo instala en la nube
if [ "$CLAUDE_CODE_REMOTE" != "true" ]; then
  exit 0
fi
(cd frontend && npm install)
(cd backend && npm install)
exit 0
```

---

## 5. Iniciar una sesión de trabajo

1. En **claude.ai/code**, debajo del cuadro de texto, abrí el **selector de repositorio** y elegí `nicolasmerida/sistema-ar-jet`.
2. En el **selector de rama** elegí desde qué rama arrancar (normalmente `main`).
3. Elegí el **entorno** (Default o el que configuraron).
4. Elegí el **modo de permiso** (ver sección 6).
5. Escribí la tarea y apretá **Enter**.

Cada tarea crea **su propia sesión y su propia rama** (por ejemplo `claude/xxxx`), así que podés lanzar varias en paralelo (una por User Story) sin que se pisen.

Mientras trabaja podés:
- Escribirle mensajes para corregir el rumbo (quedan en cola hasta que los lee; con la ✕ podés retirarlos antes).
- Cerrar la pestaña: sigue trabajando en segundo plano.

Comandos útiles dentro de una sesión en la nube:

| Comando | Qué hace |
|---|---|
| `/compact` | Resume la conversación para liberar contexto. |
| `/context` | Muestra qué está ocupando el contexto. |
| `/model <nombre>` | Cambia el modelo. |
| `/teleport` | Te da el comando exacto para continuar la sesión en tu terminal. |

`/clear` **no** funciona en la nube: para empezar de cero, abrí una sesión nueva desde la barra lateral.

---

## 6. Modos de permiso

Se eligen en el desplegable junto al cuadro de texto (al crear la tarea o durante la sesión):

| Modo | Comportamiento | Cuándo usarlo |
|---|---|---|
| **Plan** | Claude investiga y **propone un plan**; no edita archivos hasta que lo aprobás. | Tareas grandes o cuando querés **aprender** qué va a hacer antes de que lo haga. Muy recomendado mientras están aprendiendo Next.js. |
| **Accept edits** | Edita, commitea y pushea sin pedir confirmación. | Tareas chicas y bien definidas. |
| **Auto** | Un clasificador revisa las acciones en lugar de preguntarte. Aparece solo si tu organización lo permite y el modelo lo soporta. | Tareas largas que no querés supervisar. |

En la nube **no existen** los modos *Manual* ni *Bypass permissions*.

---

## 7. Cómo pedirle tareas a Claude

Regla de oro: **sé específico**. Nombrá archivos, pegá errores y describí el comportamiento esperado. Usá los documentos de la comisión analista como fuente.

### Malo
> Hacé lo de aeropuertos.

### Bueno
> Implementá la **US-00 "Alta de aeropuertos"** que está en `docs/comision-analista/UserStories.docx`.
> - Backend: endpoint `POST /api/aeropuertos` en `backend/` que reciba `codigo`, `nombre` y `ciudad`, valide que no estén vacíos y que el código no exista (si existe, responder 409 con el mensaje "Ya existe un aeropuerto con ese código").
> - Frontend: página `/admin/aeropuertos/nuevo` en `frontend/` con el formulario del wireframe `docs/comision-analista/WireframeLogin.png` como referencia de estilo.
> - Marcá en rojo los campos vacíos y no habilites "Guardar" hasta completarlos.
> - Al terminar corré `npm run build` y `npm run lint` en ambos proyectos y arreglá los errores.
> - Explicame en el resumen final qué archivo hace qué, porque estoy aprendiendo Next.js.

### Tipos de pedido útiles para aprender

- **Preguntas sin cambios:** "Explicame cómo funciona el archivo `frontend/app/layout.tsx` línea por línea. No modifiques nada."
- **Revisión:** "Revisá el código de la rama `feature/US-03-alta-aviones` y decime qué errores ves."
- **Depuración:** "Al correr `npm run dev` me sale este error: (pegar error). Encontrá la causa."
- **Tests:** "Escribí casos de prueba para los caminos alternativos de la US-01."

---

## 8. Revisar los cambios y crear un Pull Request

1. Cuando Claude termina, aparece un indicador tipo **`+42 −18`** (líneas agregadas/eliminadas). Tocalo para abrir la **vista de diff**: archivos a la izquierda, cambios a la derecha.
2. Por defecto compara contra la rama base; con **Compare against** podés elegir otra.
3. **Comentarios en línea:** seleccioná una línea, escribí tu observación y Enter. Los comentarios se acumulan y se envían junto con tu próximo mensaje (Claude recibe algo como "en `src/x.ts:47`, no atrapes el error acá").
4. Cuando el diff está bien: botón **Create PR** arriba de la vista de diff (PR completo, borrador o ir a la página de GitHub con título y descripción generados).
5. En GitHub, otro integrante revisa y aprueba; recién ahí se hace el **merge** a `main`.

> El README del repo establece: **no pushear directo a `main`** y **pedir revisión a otro integrante**. Claude respeta eso trabajando siempre en su propia rama.

---

## 9. Git y GitHub: lo mínimo que tenés que entender

Aunque Claude haga los commits, necesitás entender qué está pasando.

```text
main ──●────●────────────●────── (código estable, lo que se presenta en la demo)
        \               /
         ●───●───●─────●   feature/US-00-alta-aeropuertos  (tu trabajo)
                       ↑
                  Pull Request + revisión + merge
```

| Comando | Para qué sirve |
|---|---|
| `git clone <url>` | Descargar el repo por primera vez. |
| `git status` | Ver qué archivos cambiaste. |
| `git checkout -b feature/US-XX-desc` | Crear una rama nueva y pasarte a ella. |
| `git add <archivo>` | Marcar cambios para el próximo commit. |
| `git commit -m "mensaje"` | Guardar un "punto de control" con descripción. |
| `git push -u origin <rama>` | Subir tu rama a GitHub. |
| `git pull origin main` | Traer lo último de `main`. |
| `git log --oneline` | Ver el historial. |

**Conflicto de merge:** pasa cuando dos personas cambiaron las mismas líneas. En la sesión podés pedirle: *"Traé los cambios de `main` a esta rama y resolvé los conflictos explicándome qué elegiste en cada caso."*

---

## 10. Flujo de trabajo recomendado para el equipo

Alineado con los sprints del enunciado (planning, dailies, demo, retrospectiva):

1. **Planning:** la comisión analista asigna User Stories (US-00, US-01…). Cada integrante toma las suyas.
2. **Una sesión por User Story.** Título de la tarea con el ID: *"US-03 Alta de aviones"*.
3. Empezá en **modo Plan**, leé el plan, preguntá lo que no entiendas y recién después aprobá.
4. Pedile que corra `npm run lint` y `npm run build` antes de terminar.
5. Revisá el diff, dejá comentarios, iterá.
6. **Create PR** → asigná a un compañero como revisor.
7. Cuando se mergea, archivá la sesión (barra lateral → ícono de archivar).
8. Para la **daily**: el historial de la sesión y el PR sirven como evidencia de lo hecho.

**Compartir una sesión:** en el menú de la sesión podés cambiar la visibilidad (*Private* / *Team* en planes Team; *Private* / *Public* en Pro/Max) y pasar el link. Revisá antes que no haya credenciales en la conversación.

---

## 11. Otras formas de usarlo

### Celular
App **Claude** (iOS/Android) → pestaña **Code**. Podés iniciar tareas, ver el progreso, responder preguntas y revisar diffs.

### App de escritorio
Al iniciar una sesión elegí **Cloud** en lugar de **Local**.

### Terminal (Claude Code CLI)
Requiere tener instalado Claude Code y estar logueado con la misma cuenta de claude.ai.

```bash
# Crear una sesión en la nube para el repo de la carpeta actual
# (clona la rama actual desde GitHub, así que primero hacé push)
claude --cloud "Implementá la US-04 Baja de aviones"

# Mandar un mensaje a una sesión que ya está corriendo
claude -p "Ahora agregá validación de matrícula" --cloud <session-id>

# Traer una sesión de la nube a tu PC (descarga la rama y la conversación)
claude --teleport            # muestra un selector
claude --teleport <session-id>
```

`--teleport` exige tener el repo clonado, sin cambios sin commitear, y estar en la misma cuenta. Lo que hagas después en local **no** se refleja en la sesión web.

---

## 12. Auto-fix de Pull Requests

Con la Claude GitHub App instalada, Claude puede **vigilar un PR** y reaccionar solo cuando:
- falla el CI (tests/lint automáticos), o
- un revisor deja un comentario.

Cómo activarlo:
- En la sesión de claude.ai/code: barra de estado de CI → **Auto-fix**.
- Desde la terminal: `/autofix-pr` estando en la rama del PR.
- En cualquier sesión: pegá la URL del PR y decí "vigilá este PR y arreglá fallas de CI o comentarios".

Si el arreglo es claro lo pushea; si el comentario es ambiguo, te pregunta. Para cortarlo: desactivá el toggle o decile que deje de vigilar.

---

## 13. `CLAUDE.md` y la carpeta `.claude/`

Claude empieza **cada sesión sin memoria** de las anteriores. Para darle contexto permanente se usa un archivo **`CLAUDE.md`** en la raíz del repo (y opcionalmente en `frontend/` y `backend/`). Todo lo que escribas ahí lo lee al arrancar.

Ejemplo de lo que convendría poner para AR-Jet:

```markdown
# Sistema AR-Jet — Instrucciones para Claude

- Idioma del código: nombres de variables/funciones en español (ej. `crearVuelo`), comentarios en español.
- Frontend en `frontend/` (Next.js + TypeScript, App Router). Backend en `backend/` (Node.js + TypeScript).
- Base de datos: PostgreSQL en Neon. Nunca commitear `.env`.
- Requisitos: `docs/comision-analista/` (UserStories.docx, Entidades-BD.docx, Diagrama-ER.drawio).
- Antes de terminar una tarea: `npm run lint` y `npm run build` en el proyecto tocado.
- Ramas: `feature/US-XX-descripcion`. Nunca pushear a `main`.
- Explicar los cambios de forma didáctica: el equipo está aprendiendo Next.js y TypeScript.
```

Otros archivos de la carpeta `.claude/` que se pueden versionar:

| Archivo | Uso |
|---|---|
| `.claude/settings.json` | Configuración compartida (hooks, permisos). |
| `.claude/agents/*.md` | Subagentes personalizados. |
| `.claude/skills/*/SKILL.md` | "Habilidades" reutilizables (por ejemplo, cómo crear un ABM según las convenciones del equipo). |

Podés pedirle a Claude: *"Creá un `CLAUDE.md` para este repo"* (o usar el comando `/init`).

---

## 14. Secretos y seguridad

- **Nunca** escribas contraseñas ni la connection string de Neon en el chat, en el código, ni en archivos commiteados. El `.gitignore` del repo ya ignora `.env` y `.env.*` (excepto `.env.example`).
- Las credenciales de GitHub **no entran** a la máquina virtual: un proxy las agrega del lado del servidor.
- Las variables del entorno son visibles para quien use ese entorno. Para la base, preferí una **rama de Neon de desarrollo** con datos de prueba.
- Si por error se commitea un secreto: rotalo (cambiá la contraseña en Neon) inmediatamente; borrarlo del archivo no alcanza porque queda en el historial.

---

## 15. Límites y problemas comunes

| Situación | Qué hacer |
|---|---|
| "No aparece el repo" | Instalar la Claude GitHub App en el repo (sección 3). |
| `npm install` falla por red | El entorno está en **None** o en un **Custom** sin la lista por defecto. Cambiar a **Trusted** o tildar la lista por defecto. |
| No conecta a Neon | Agregar `*.neon.tech` con **Custom** (sección 4.1). |
| "Environment expired" | La sesión estuvo inactiva. Reabrila desde la barra lateral: se crea una VM nueva con el historial (los procesos en segundo plano no vuelven). |
| La sesión sigue al cerrar la pestaña | Es normal. Archivala cuando termines. |
| Se agotan los límites de uso | Las sesiones en la nube comparten el límite con el resto de tu uso de Claude. Muchas tareas en paralelo consumen más. No hay cargo extra por la VM. |
| Setup script falla | Agregar `set -x` al inicio para ver qué comando falló; para pasos no críticos, `|| true`. |

---

## 16. Cheat sheet

```text
claude.ai/code                       → iniciar/ver sesiones
Repo selector + branch selector      → elegir sistema-ar-jet / main
Mode: Plan | Accept edits | Auto     → Plan para aprender
+N −M (diff)                         → revisar cambios, comentar líneas
Create PR                            → abrir el Pull Request
CI status bar → Auto-fix             → vigilar el PR
Environment → Edit                   → red, variables, setup script
Custom network + *.neon.tech         → acceso a la base en Neon
/compact  /context  /teleport        → comandos en la sesión
claude --cloud "tarea"               → nueva sesión desde la terminal
claude --teleport                    → traer sesión a tu PC
```

### Documentación oficial

- Inicio rápido: https://code.claude.com/docs/en/web-quickstart
- Referencia completa: https://code.claude.com/docs/en/claude-code-on-the-web
- Entornos: https://code.claude.com/docs/en/cloud-environments
- `CLAUDE.md` / memoria: https://code.claude.com/docs/en/memory
