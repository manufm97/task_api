// Load environment variables first
require('dotenv').config()

const express = require('express')
const path = require('path')
const swaggerJsdoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express')

const app = express()
const PORT = process.env.PORT || 3000
const ENVIRONMENT = process.env.ENVIRONMENT || 'development'

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Task API',
      version: '1.0.0',
      description: 'Una API para la gestión de tareas con documentación Swagger y una interfaz de usuario basada en Material Design.',
      contact: {
        name: 'API Support',
        email: 'manufm97@gmail.com'
      },
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: `${ENVIRONMENT} server`,
      },
    ],
  },
  apis: ['./app.js', './routes/*.js'], // paths to files containing OpenAPI definitions
}

const specs = swaggerJsdoc(swaggerOptions)

const fs = require('fs')

app.disable('x-powered-by')
app.use(express.json())

// Serve static files (CSS, JS, images, etc.)
app.use(express.static(path.join(__dirname)))

// Import routes
const tasksRoutes = require('./routes/tasks')
const usersRoutes = require('./routes/users')

// Swagger middleware
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs))

// API routes
app.use('/api/tasks', tasksRoutes)
app.use('/api/users', usersRoutes)

/**
 * @swagger
 * /:
 *   get:
 *     summary: Homepage
 *     description: Serves the TaskAPI homepage with Material Design interface
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               example: 'TaskAPI Homepage'
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages/index.html'))
})

/**
 * @swagger
 * /ping:
 *   get:
 *     summary: Health check
 *     description: Returns the health status of the API
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: 'OK'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 environment:
 *                   type: string
 *                   example: 'development'
 */
app.get('/ping', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: ENVIRONMENT
  })
})

/**
 * @swagger
 * /api/readme:
 *   get:
 *     summary: Get README markdown
 *     description: Returns the README.md file content as markdown
 *     responses:
 *       200:
 *         description: README content
 *         content:
 *           text/markdown:
 *             schema:
 *               type: string
 */
app.get('/api/readme', (req, res) => {
  const readmePath = path.join(__dirname, 'README.md')
  fs.readFile(readmePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error reading README' })
    }
    res.type('text/markdown').send(data)
  })
})

// Catch-all route for 404 errors

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'pages/404.html'))
})

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`)
  console.log(`📚 Swagger Documentation: http://localhost:${PORT}/api-docs`)
  console.log(`📊 Environment: ${ENVIRONMENT}`)
  console.log(`🗄️  Database: ${process.env.DB_DRIVER || 'Not configured'}`)
  console.log(`🔗 Database Host: ${process.env.DB_HOST || 'Not configured'}`)
})
