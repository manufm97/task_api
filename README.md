# Task API

Una API REST para gestión de tareas construida con Node.js, Express y Knex.js con MySQL/MariaDB.

## Tabla de Contenidos

- [Características](#características)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Uso](#uso)
- [Endpoints de la API](#endpoints-de-la-api)
- [Base de Datos](#base-de-datos)
- [Scripts](#scripts)
- [Estructura del Proyecto](#estructura-del-proyecto)

## Características

- CRUD RESTful para tareas y usuarios
- Autenticación JWT con hashing de contraseñas argon2
- Documentación interactiva de API con Swagger/OpenAPI 3.0 (en `/api-docs`)
- Integración con base de datos MySQL/MariaDB mediante Knex.js
- Soporte multi-entorno (development, staging, production)
- Endpoint de health check (`/ping`)
- Página de inicio estática con modo oscuro
- Paginación y filtros

## Requisitos Previos

- Node.js 14+
- pnpm
- Servidor MySQL o MariaDB

## Instalación

1. **Clona el repositorio:**

   ```bash
   git clone <repository-url>
   cd task_api
   ```
2. **Instala las dependencias:**

   ```bash
   pnpm install
   ```
3. **Configura las variables de entorno:**

   Copia el archivo `.env` y ajusta los valores según sea necesario:

   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=taskapi_db
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_DRIVER=mysql2
   ENVIRONMENT=development
   PORT=3000
   JWT_SECRET=your_jwt_secret_key_here
   API_KEY=your_api_key_here
   ```
4. **Inicializa la base de datos, ejecuta migraciones y siembra datos:**

   ```bash
   pnpm migrate
   ```

## Uso

### Iniciar el Servidor

```bash
# Modo desarrollo (reinicio automático en cambios)
pnpm dev

# Modo producción
node app.js
```

El servidor arranca en `http://localhost:3000`. Swagger UI está disponible en `http://localhost:3000/api-docs`.

## Endpoints de la API

### Tareas

| Método    | Endpoint             | Descripción                                               |
| ---------- | -------------------- | ---------------------------------------------------------- |
| `GET`    | `/api/tasks`       | Listar tareas (query:`page`, `limit`, `priority_id`) |
| `GET`    | `/api/tasks/:guid` | Obtener una tarea por GUID                                 |
| `POST`   | `/api/tasks`       | Crear una tarea (`title` requerido)                      |
| `PUT`    | `/api/tasks/:guid` | Actualización completa de una tarea                       |
| `PATCH`  | `/api/tasks/:guid` | Actualización parcial de una tarea                        |
| `DELETE` | `/api/tasks/:guid` | Eliminar una tarea                                         |

### Usuarios

| Método    | Endpoint             | Descripción                                            |
| ---------- | -------------------- | ------------------------------------------------------- |
| `GET`    | `/api/users`       | Listar usuarios (query:`page`, `limit`, `active`) |
| `GET`    | `/api/users/:guid` | Obtener un usuario por GUID                             |
| `POST`   | `/api/users`       | Registrar un usuario                                    |
| `POST`   | `/api/users/login` | Iniciar sesión (devuelve token JWT)                    |
| `PUT`    | `/api/users/:guid` | Actualización completa de un usuario                   |
| `PATCH`  | `/api/users/:guid` | Actualización parcial de un usuario                    |
| `DELETE` | `/api/users/:guid` | Eliminar un usuario                                     |

### Sistema

| Método | Endpoint        | Descripción                       |
| ------- | --------------- | ---------------------------------- |
| `GET` | `/`           | Página de inicio                  |
| `GET` | `/ping`       | Health check                       |
| `GET` | `/api/readme` | Devuelve este README como markdown |
| `GET` | `/api-docs`   | Documentación Swagger UI          |

### Formato de Respuesta

Todas las respuestas de la API siguen una estructura consistente:

```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": {},
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

## Base de Datos

El proyecto usa **Knex.js** como query builder y herramienta de migraciones con **MySQL/MariaDB**.

### Esquema

La base de datos incluye las siguientes tablas:

- `users` — Cuentas de usuario con información de perfil
- `priorities` — Niveles de prioridad de tareas (Muy Baja a Urgente)
- `statuses` — Estados de tarea (Creada, Asignada, En Progreso, Completada)
- `tasks` — Tareas con título, descripción, timestamps y referencia a prioridad
- `task_status_history` — Historial de cambios de estado de tareas
- `task_comments` — Comentarios en tareas
- `task_attachments` — Archivos adjuntos a tareas

### Migraciones

```bash
# Ejecutar migraciones (crea la BD si no existe)
pnpm migrate

# Revertir el último lote de migraciones
pnpm migrate:rollback

# Crear una nueva migración
pnpm exec knex migrate:make nombre_migracion
```

### Seeds

```bash
# Ejecutar todos los archivos seed
pnpm seed

# Crear un nuevo archivo seed
pnpm exec knex seed:make nombre_seed
```

## Scripts

| Comando                   | Descripción                                        |
| ------------------------- | --------------------------------------------------- |
| `pnpm dev`              | Iniciar en modo desarrollo con reinicio automático |
| `pnpm migrate`          | Crear BD, ejecutar migraciones y sembrar datos      |
| `pnpm migrate:rollback` | Revertir el último lote de migraciones             |
| `pnpm seed`             | Re-ejecutar archivos seed                           |

## Estructura del Proyecto

```
task_api/
├── app.js              # Punto de entrada de la aplicación Express
├── knexfile.js         # Configuración de base de datos Knex
├── .env                # Variables de entorno
├── package.json        # Dependencias y scripts
├── config/
│   └── database.js     # Fábrica de instancias Knex
├── routes/
│   ├── tasks.js        # Rutas CRUD de tareas con anotaciones Swagger
│   └── users.js        # Rutas CRUD de usuarios y login con anotaciones Swagger
├── migrations/         # Migraciones de base de datos
├── seeds/              # Archivos seed (estados, prioridades)
├── scripts/
│   └── init-db.js      # Script de creación de base de datos
├── pages/              # Archivos frontend estáticos
│   ├── index.html      # Página de inicio
│   ├── 404.html        # Página 404 personalizada
│   ├── css/styles.css  # Estilos con soporte de modo oscuro
│   └── js/index.js     # JavaScript del frontend
└── .vscode/
    └── settings.json   # Configuración de VS Code
```

## Contribuir

1. Haz un fork del proyecto
2. Crea una rama para tu funcionalidad (`git checkout -b feature/AmazingFeature`)
3. Haz commit de tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Haz push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Soporte

Si tienes alguna pregunta o problema, por favor abre un issue en GitHub.
