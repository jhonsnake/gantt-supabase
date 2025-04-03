# Gantt Chart App

Una aplicación moderna de diagrama de Gantt construida con Next.js, Supabase y TailwindCSS.

## Tecnologías Principales

- **Next.js 14**: Framework de React para producción
- **Supabase**: Backend as a Service para gestión de datos
- **TailwindCSS**: Framework de CSS utilitario
- **TypeScript**: Tipado estático para JavaScript
- **Radix UI**: Componentes accesibles y sin estilos

## Características

- Visualización de diagramas de Gantt interactivos
- Gestión de tareas y proyectos
- Interfaz moderna y responsiva
- Componentes reutilizables
- Integración con Supabase para persistencia de datos

## Requisitos Previos

- Node.js (versión 18 o superior)
- pnpm

## Instalación

1. Clonar el repositorio:
   ```bash
   git clone [url-del-repositorio]
   cd gantt-supabase
   ```

2. Instalar dependencias:
   ```bash
   pnpm install
   ```

3. Configurar variables de entorno:
   Crear un archivo `.env.local` con las siguientes variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=tu-url-de-supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-key-de-supabase
   ```

4. Iniciar el servidor de desarrollo:
   ```bash
   pnpm dev
   ```

## Scripts Disponibles

- `pnpm dev`: Inicia el servidor de desarrollo
- `pnpm build`: Construye la aplicación para producción
- `pnpm start`: Inicia la aplicación en modo producción
- `pnpm lint`: Ejecuta el linter

## Estructura del Proyecto

- `/app`: Rutas y páginas de la aplicación
- `/components`: Componentes reutilizables
- `/hooks`: Custom hooks
- `/lib`: Utilidades y configuraciones
- `/styles`: Estilos globales
- `/types`: Definiciones de tipos TypeScript

## Licencia

MIT
