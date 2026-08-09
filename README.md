# Live Polling

Live Polling es una plataforma web para crear y ejecutar sesiones de votación en vivo.

Un host crea una sesión, prepara sus encuestas y controla lo que ocurre en tiempo real. Los participantes se unen sin crear una cuenta, usando un código de sala o un enlace de invitación.

El servidor mantiene el estado principal de cada sesión. Esto evita perder respuestas cuando hay una desconexión o cuando varias personas responden al mismo tiempo.

## Funciones

### Para hosts

- Iniciar sesión sin contraseña mediante un enlace mágico enviado por email.
- Verificar el email del host.
- Crear, renombrar, iniciar, finalizar y eliminar sesiones.
- Ver las sesiones agrupadas como borrador, en vivo o finalizadas.
- Obtener un código de sala y un enlace de invitación.
- Crear encuestas de selección única, selección múltiple y respuesta abierta.
- Editar, eliminar y cambiar el orden de las encuestas antes de recibir respuestas.
- Bloquear la edición de una encuesta después de recibir respuestas.
- Abrir y cerrar encuestas durante una sesión en vivo.
- Mostrar u ocultar los resultados para los participantes.
- Ver respuestas, porcentajes y el número de participantes en tiempo real.
- Consultar el historial y los resultados de sesiones finalizadas.

### Para participantes

- Unirse con un código de sala o un enlace de invitación.
- Participar sin crear una cuenta.
- Usar una identidad local para cada sesión.
- Guardar el token de participación en el navegador para continuar después de recargar la página.
- Cambiar el nombre mostrado durante la sesión.
- Ver un estado de espera cuando no hay una encuesta activa.
- Responder encuestas de selección única, selección múltiple o respuesta abierta.
- Cambiar una respuesta mientras la encuesta siga abierta.
- Ver resultados agrupados cuando el host los revela.
- Recibir cambios en vivo y volver a sincronizar el estado después de una desconexión.

### Funciones técnicas

- API HTTP creada con NestJS y validación de datos con Zod.
- Autenticación del host con Better Auth y enlaces mágicos.
- PostgreSQL para guardar sesiones, encuestas, participantes y respuestas.
- Drizzle ORM y migraciones para administrar la base de datos.
- Redis para presencia, límites de uso y coordinación de Socket.io.
- Socket.io para actualizaciones en tiempo real.
- Revisiones de sesión para detectar eventos atrasados y pedir una nueva sincronización.
- Límites de uso, CORS, métricas, logs estructurados y apagado controlado.
- Pruebas unitarias y de integración con Vitest.

## Tecnologías

- TypeScript
- React 19 y Vite
- TanStack Router y TanStack Query
- Tailwind CSS y componentes basados en shadcn
- NestJS
- Better Auth
- Drizzle ORM
- PostgreSQL
- Redis
- Socket.io
- pnpm y Turborepo

## Estructura del proyecto

```text
.
├── apps/
│   ├── backend/    API, autenticación, base de datos y tiempo real
│   └── frontend/   Aplicación web para hosts y participantes
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## Requisitos

- Docker Desktop con Docker Compose.
- Git.

Opcional (solo para desarrollo local sin Docker):

- Node.js en una versión compatible con las dependencias del proyecto.
- pnpm `11.5.1`.

Puedes activar la versión de pnpm del proyecto con Corepack:

```bash
corepack enable
corepack prepare pnpm@11.5.1 --activate
```

Comprueba la versión instalada:

```bash
pnpm --version
```

## Instalación local (Docker)

### 1. Descargar el proyecto

```bash
git clone https://github.com/johandev21/live-polling.git
cd live-polling
```

### 2. Iniciar toda la aplicación

```bash
docker compose up --build
```

O desde pnpm:

```bash
pnpm docker:up
```

El primer inicio compila el frontend y el backend dentro de Docker, aplica las
migraciones de la base de datos y arranca todos los servicios. Solo necesitas
Docker Desktop: no hace falta instalar Node.js ni pnpm.

Los valores por defecto son suficientes para el desarrollo local. Para
sobrescribir los secretos, copia `.env.example` a `.env`:

```bash
cp .env.example .env
```

La aplicación estará disponible en:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- Estado del backend: `http://localhost:3000/health/live`
- Estado de dependencias: `http://localhost:3000/health/ready`
- Correos de prueba (Mailpit): `http://localhost:8025`

### Servicios y puertos

| Servicio   | Acceso desde el host                    | Puerto interno | Uso                                              |
| ---------- | --------------------------------------- | -------------- | ------------------------------------------------ |
| frontend   | `http://localhost:5173`                 | `80`           | Aplicación web (nginx)                           |
| backend    | `http://localhost:3000`                 | `3000`         | API, autenticación y tiempo real (Socket.io)     |
| postgres   | `localhost:5433`                        | `5432`         | Base de datos principal                          |
| redis      | `localhost:6379`                       | `6379`         | Presencia, límites de uso y Socket.io            |
| mailpit    | Web `http://localhost:8025` · SMTP `localhost:1025` | `8025`/`1025` | Captura de correos de prueba                     |

### Correos de prueba (Mailpit)

Durante el desarrollo los emails no se envían a un servicio real: Mailpit los
captura y los muestra en su panel web.

1. Abre `http://localhost:8025`.
2. Cuando pidas un enlace mágico o una verificación de email, el mensaje aparece
   en la bandeja de entrada.
3. Haz clic en el mensaje y después en el enlace del correo para completar la
   acción. También puedes copiar la URL directamente del contenido.

Los correos se mantienen en memoria de Mailpit mientras los contenedores estén
activos. `docker compose down -v` los borra junto con la base de datos.

## Desarrollo local sin Docker

Instala las dependencias, inicia PostgreSQL, Redis y Mailpit con Docker
(`docker compose up -d postgres redis mailpit`) y ejecuta el resto como
siempre: `pnpm install`, crea `apps/backend/.env` a partir de
`apps/backend/.env.example` y ejecuta `pnpm dev`.

## Flujo de prueba local

1. Abre `http://localhost:5173`.
2. Entra como host y solicita un enlace mágico.
3. Abre `http://localhost:8025`, localiza el mensaje con el enlace de inicio de
   sesión y pulsa el enlace.
4. Crea una sesión y añade una o más encuestas.
5. Inicia la sesión y copia el código de sala o el enlace de invitación.
6. Abre una ventana privada del navegador para entrar como participante.
7. Envía respuestas y observa los cambios desde el panel del host.

## Comandos de Docker

```bash
docker compose up --build   # Construye las imágenes e inicia toda la aplicación
docker compose up -d        # Igual, pero en segundo plano (logs con docker compose logs -f)
docker compose logs -f backend   # Sigue los logs del backend
docker compose ps           # Estado de los servicios
docker compose down         # Detiene los servicios
docker compose down -v      # Detiene y borra base de datos, Redis y correos
```

La primera ejecución de `up --build` es lenta porque instala dependencias y
compila ambas aplicaciones; las siguientes usan la caché de capas de Docker.

## Comandos útiles

### Comandos del monorepo

```bash
pnpm dev              # Inicia frontend y backend
pnpm build            # Compila todas las aplicaciones
pnpm test             # Ejecuta las pruebas
pnpm lint             # Revisa el código
pnpm format:check     # Comprueba el formato
pnpm docker:up        # Inicia toda la aplicación en Docker
pnpm docker:down      # Detiene los servicios de Docker
```

### Comandos del backend

```bash
pnpm --filter backend dev
pnpm --filter backend test
pnpm --filter backend test:e2e
pnpm --filter backend test:cov
pnpm --filter backend db:generate
pnpm --filter backend db:migrate
```

### Comandos del frontend

```bash
pnpm --filter frontend dev
pnpm --filter frontend test
pnpm --filter frontend build
```

## Detener los servicios locales

```bash
docker compose down
```

Para eliminar también los datos guardados en los volúmenes de Docker:

```bash
docker compose down -v
```

El segundo comando borra la base de datos local y los datos de Redis.
