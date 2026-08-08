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

- Node.js en una versión compatible con las dependencias del proyecto.
- pnpm `11.5.1`.
- Docker Desktop con Docker Compose.
- Git.

Puedes activar la versión de pnpm del proyecto con Corepack:

```bash
corepack enable
corepack prepare pnpm@11.5.1 --activate
```

Comprueba la versión instalada:

```bash
pnpm --version
```

## Instalación local

### 1. Descargar el proyecto

```bash
git clone https://github.com/johandev21/live-polling.git
cd live-polling
```

### 2. Instalar las dependencias

```bash
pnpm install
```

### 3. Iniciar PostgreSQL, Redis y Mailpit

```bash
docker compose up -d postgres redis mailpit
```

Estos servicios usan los siguientes puertos locales:

- PostgreSQL: `5433`
- Redis: `6379`
- SMTP de Mailpit: `1025`
- Panel web de Mailpit: `http://localhost:8025`

### 4. Crear las variables de entorno del backend

En macOS o Linux:

```bash
cp apps/backend/.env.example apps/backend/.env
```

En Windows PowerShell:

```powershell
Copy-Item apps/backend/.env.example apps/backend/.env
```

Edita `apps/backend/.env` y cambia al menos estos valores:

```env
BETTER_AUTH_SECRET=una-clave-aleatoria-de-32-caracteres-o-mas
PARTICIPANT_TOKEN_SECRET=otra-clave-aleatoria-de-32-caracteres-o-mas
```

El archivo de ejemplo ya apunta a los servicios de Docker y a los puertos locales del proyecto.

### 5. Ejecutar las migraciones

```bash
pnpm --filter backend db:migrate
```

### 6. Iniciar frontend y backend

Desde la raíz del proyecto:

```bash
pnpm dev
```

La aplicación estará disponible en:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- Estado del backend: `http://localhost:3000/health/live`
- Estado de dependencias: `http://localhost:3000/health/ready`
- Panel de emails de prueba: `http://localhost:8025`

Los enlaces mágicos de inicio de sesión aparecen en Mailpit. No se envían a un servicio de email real durante el desarrollo local.

Si necesitas cambiar la URL del backend para el frontend, crea `apps/frontend/.env` con esta variable:

```env
VITE_API_URL=http://localhost:3000
```

## Flujo de prueba local

1. Abre `http://localhost:5173`.
2. Entra como host y solicita un enlace mágico.
3. Abre el enlace desde Mailpit.
4. Crea una sesión y añade una o más encuestas.
5. Inicia la sesión y copia el código de sala o el enlace de invitación.
6. Abre una ventana privada del navegador para entrar como participante.
7. Envía respuestas y observa los cambios desde el panel del host.

## Comandos útiles

### Comandos del monorepo

```bash
pnpm dev              # Inicia frontend y backend
pnpm build            # Compila todas las aplicaciones
pnpm test             # Ejecuta las pruebas
pnpm lint             # Revisa el código
pnpm format:check     # Comprueba el formato
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
