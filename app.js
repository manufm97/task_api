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
      description: 'A simple Task Management API',
      contact: {
        name: 'API Support',
        email: 'support@taskapi.com'
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

app.disable('x-powered-by')
app.use(express.json())

// Serve static files (CSS, JS, images, etc.)
app.use(express.static(path.join(__dirname)))

// Swagger middleware
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs))

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
 * /health:
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
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: ENVIRONMENT
    })
})

/**
 * @swagger
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       required:
 *         - id
 *         - title
 *         - completed
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the task
 *         title:
 *           type: string
 *           description: The title of the task
 *         description:
 *           type: string
 *           description: The description of the task
 *         completed:
 *           type: boolean
 *           description: Whether the task is completed
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the task was created
 *       example:
 *         id: 1
 *         title: 'Complete project documentation'
 *         description: 'Write comprehensive documentation for the project'
 *         completed: false
 *         createdAt: '2023-06-17T10:30:00Z'
 */

app.use((req, res) => {
    res.status(404).send('<h1>Error 404 Not Found</h1>')
})

app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`)
    console.log(`📚 Swagger Documentation: http://localhost:${PORT}/api-docs`)
    console.log(`📊 Environment: ${ENVIRONMENT}`)
    console.log(`🗄️  Database: ${process.env.DB_DRIVER || 'Not configured'}`)
    console.log(`🔗 Database Host: ${process.env.DB_HOST || 'Not configured'}`)
})
