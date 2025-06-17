# Task API 🚀

Una API REST simple para gestión de tareas construida con Node.js, Express y Knex.js.

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [Documentación de la API](#-documentación-de-la-api)
- [Base de Datos](#-base-de-datos)
- [Scripts Disponibles](#-scripts-disponibles)
- [Estructura del Proyecto](#-estructura-del-proyecto)

## ✨ Características

- 🔧 **Configuración con variables de entorno** usando archivos `.env`
- 📚 **Documentación automática** con Swagger/OpenAPI 3.0
- 🗄️ **Integración con base de datos** usando Knex.js
- 🏥 **Health check endpoint** para monitoreo
- 🛡️ **Configuración de seguridad** básica
- 🌍 **Soporte multi-entorno** (development, staging, production)

## 📋 Requisitos Previos

- Node.js (versión 14 o superior)
- npm o yarn
- Base de datos (PostgreSQL, MySQL, SQLite, etc.)

## 🛠️ Instalación

1. **Clona el repositorio:**

   ```bash
   git clone <repository-url>
   cd TaskAPI
   ```
2. **Instala las dependencias:**

   ```bash
   npm install
   ```

## ⚙️ Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Database Connection Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=taskapi_db
DB_USER=your_username
DB_PASSWORD=your_password
DB_DRIVER=postgresql

# Alternative connection string format
# DATABASE_URL=postgresql://username:password@localhost:5432/taskapi_db

# Application Configuration
ENVIRONMENT=development
PORT=3000

# Security
JWT_SECRET=your_jwt_secret_key_here
API_KEY=your_api_key_here
```

### Configuración de Base de Datos

El proyecto incluye un `knexfile.js` configurado para usar las variables de entorno:

- **Development**: Configuración local usando variables del `.env`
- **Staging**: Configuración de pruebas
- **Production**: Configuración optimizada para producción con soporte SSL

## 🚀 Uso

### Iniciar el Servidor

```bash
node app.js
```

Verás un mensaje similar a:

```
🚀 Server is running on http://localhost:3000
📚 Swagger Documentation: http://localhost:3000/api-docs
📊 Environment: development
🗄️  Database: postgresql
🔗 Database Host: localhost
```

### Endpoints Disponibles

- **GET /** - Página de bienvenida
- **GET /health** - Health check de la API
- **GET /api-docs** - Documentación interactiva de Swagger

## 📚 Documentación de la API

### Swagger UI

La documentación interactiva de la API está disponible en:

```
http://localhost:3000/api-docs
```

### Health Check

Para verificar el estado de la API:

```bash
curl http://localhost:3000/health
```

Respuesta:

```json
{
  "status": "OK",
  "timestamp": "2023-06-17T15:22:46.000Z",
  "environment": "development"
}
```

### Agregar Documentación a Nuevas Rutas

Para documentar nuevos endpoints, usa comentarios JSDoc con anotaciones Swagger:

```javascript
/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Obtener todas las tareas
 *     description: Retorna una lista de todas las tareas
 *     responses:
 *       200:
 *         description: Lista de tareas exitosa
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 */
app.get('/api/tasks', (req, res) => {
  // Lógica del endpoint
});
```

## 🗄️ Base de Datos

### Configuración con Knex

El proyecto está configurado para trabajar con múltiples tipos de base de datos:

- **PostgreSQL** (por defecto)
- **MySQL**
- **SQLite**
- **SQL Server**

### Migraciones

```bash
# Crear una nueva migración
npx knex migrate:make migration_name

# Ejecutar migraciones
npx knex migrate:latest

# Rollback migraciones
npx knex migrate:rollback
```

### Seeds

```bash
# Crear un nuevo seed
npx knex seed:make seed_name

# Ejecutar seeds
npx knex seed:run
```

## 📜 Scripts Disponibles

```bash
# Iniciar la aplicación
npm start

# Iniciar en modo desarrollo (si tienes nodemon)
npm run dev

# Ejecutar migraciones
npm run migrate

# Ejecutar seeds
npm run seed
```

## 📁 Estructura del Proyecto

```
TaskAPI/
├── app.js              # Archivo principal de la aplicación
├── knexfile.js         # Configuración de Knex/Base de datos
├── .env                # Variables de entorno
├── package.json        # Dependencias y scripts
├── README.md          # Este archivo
├── migrations/        # Migraciones de base de datos
├── seeds/            # Seeds de base de datos
└── routes/           # Archivos de rutas
```

## 🔒 Seguridad

- **Variables de entorno**: Nunca commitees el archivo `.env` al repositorio
- **Secrets**: Usa gestores de secretos en producción
- **SSL**: Configurado automáticamente en producción para bases de datos en la nube

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 📞 Soporte

Si tienes alguna pregunta o problema, puedes:

- Crear un issue en GitHub
- Contactar al equipo de soporte: support@taskapi.com

---

**¡Desarrollado con ❤️ para la gestión eficiente de tareas!**
