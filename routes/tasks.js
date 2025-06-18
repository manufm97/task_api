const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Obtener todas las tareas
 *     description: Retorna una lista de todas las tareas con paginación opcional
 *     tags: [Tasks]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Número de tareas por página
 *       - in: query
 *         name: completed
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado de completado
 *     responses:
 *       200:
 *         description: Lista de tareas obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get('/', (req, res) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 10;
		const completed = req.query.completed;

		let filteredTasks = tasks;

		// Filtrar por estado de completado si se especifica
		if (completed !== undefined) {
			const isCompleted = completed === 'true';
			filteredTasks = tasks.filter(task => task.completed === isCompleted);
		}

		// Calcular paginación
		const startIndex = (page - 1) * limit;
		const endIndex = startIndex + limit;
		const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

		const total = filteredTasks.length;
		const totalPages = Math.ceil(total / limit);

		res.status(200).json({
			success: true,
			data: paginatedTasks,
			pagination: {
				page,
				limit,
				total,
				totalPages
			}
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Error interno del servidor',
			error: error.message
		});
	}
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Obtener una tarea por ID
 *     description: Retorna una tarea específica por su ID
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la tarea
 *     responses:
 *       200:
 *         description: Tarea encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       404:
 *         description: Tarea no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.get('/:id', (req, res) => {
	try {
		const id = parseInt(req.params.id);

		if (isNaN(id)) {
			return res.status(400).json({
				success: false,
				message: 'ID inválido'
			});
		}

		const task = tasks.find(t => t.id === id);

		if (!task) {
			return res.status(404).json({
				success: false,
				message: 'Tarea no encontrada'
			});
		}

		res.status(200).json({
			success: true,
			data: task
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Error interno del servidor',
			error: error.message
		});
	}
});

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Crear una nueva tarea
 *     description: Crea una nueva tarea en el sistema
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *                 description: Título de la tarea
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Descripción de la tarea
 *               completed:
 *                 type: boolean
 *                 default: false
 *                 description: Estado de completado
 *             example:
 *               title: "Nueva tarea"
 *               description: "Descripción de la nueva tarea"
 *               completed: false
 *     responses:
 *       201:
 *         description: Tarea creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.post('/', (req, res) => {
	try {
		const { title, description, completed } = req.body;

		// Validaciones
		const errors = [];

		if (!title || title.trim() === '') {
			errors.push('El título es obligatorio');
		} else if (title.length > 200) {
			errors.push('El título no puede exceder 200 caracteres');
		}

		if (description && description.length > 1000) {
			errors.push('La descripción no puede exceder 1000 caracteres');
		}

		if (errors.length > 0) {
			return res.status(400).json({
				success: false,
				message: 'Datos inválidos',
				errors
			});
		}

		// Crear nueva tarea
		const newTask = {
			id: nextId++,
			title: title.trim(),
			description: description ? description.trim() : '',
			completed: completed || false,
			createdAt: new Date(),
			updatedAt: new Date()
		};

		tasks.push(newTask);

		res.status(201).json({
			success: true,
			message: 'Tarea creada exitosamente',
			data: newTask
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Error interno del servidor',
			error: error.message
		});
	}
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Actualizar una tarea completa
 *     description: Actualiza todos los campos de una tarea existente
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la tarea
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *               completed:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Tarea actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       404:
 *         description: Tarea no encontrada
 *       400:
 *         description: Datos inválidos
 */
router.put('/:id', (req, res) => {
	try {
		const id = parseInt(req.params.id);

		if (isNaN(id)) {
			return res.status(400).json({
				success: false,
				message: 'ID inválido'
			});
		}

		const taskIndex = tasks.findIndex(t => t.id === id);

		if (taskIndex === -1) {
			return res.status(404).json({
				success: false,
				message: 'Tarea no encontrada'
			});
		}

		const { title, description, completed } = req.body;

		// Validaciones
		const errors = [];

		if (!title || title.trim() === '') {
			errors.push('El título es obligatorio');
		} else if (title.length > 200) {
			errors.push('El título no puede exceder 200 caracteres');
		}

		if (description && description.length > 1000) {
			errors.push('La descripción no puede exceder 1000 caracteres');
		}

		if (errors.length > 0) {
			return res.status(400).json({
				success: false,
				message: 'Datos inválidos',
				errors
			});
		}

		// Actualizar tarea
		tasks[taskIndex] = {
			...tasks[taskIndex],
			title: title.trim(),
			description: description ? description.trim() : '',
			completed: completed !== undefined ? completed : tasks[taskIndex].completed,
			updatedAt: new Date()
		};

		res.status(200).json({
			success: true,
			message: 'Tarea actualizada exitosamente',
			data: tasks[taskIndex]
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Error interno del servidor',
			error: error.message
		});
	}
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   patch:
 *     summary: Actualizar parcialmente una tarea
 *     description: Actualiza solo los campos especificados de una tarea
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la tarea
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *               completed:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Tarea actualizada exitosamente
 *       404:
 *         description: Tarea no encontrada
 *       400:
 *         description: Datos inválidos
 */
router.patch('/:id', (req, res) => {
	try {
		const id = parseInt(req.params.id);

		if (isNaN(id)) {
			return res.status(400).json({
				success: false,
				message: 'ID inválido'
			});
		}

		const taskIndex = tasks.findIndex(t => t.id === id);

		if (taskIndex === -1) {
			return res.status(404).json({
				success: false,
				message: 'Tarea no encontrada'
			});
		}

		const { title, description, completed } = req.body;

		// Validaciones para campos presentes
		const errors = [];

		if (title !== undefined) {
			if (!title || title.trim() === '') {
				errors.push('El título no puede estar vacío');
			} else if (title.length > 200) {
				errors.push('El título no puede exceder 200 caracteres');
			}
		}

		if (description !== undefined && description.length > 1000) {
			errors.push('La descripción no puede exceder 1000 caracteres');
		}

		if (errors.length > 0) {
			return res.status(400).json({
				success: false,
				message: 'Datos inválidos',
				errors
			});
		}

		// Actualizar solo los campos proporcionados
		const updateData = { updatedAt: new Date() };

		if (title !== undefined) updateData.title = title.trim();
		if (description !== undefined) updateData.description = description.trim();
		if (completed !== undefined) updateData.completed = completed;

		tasks[taskIndex] = { ...tasks[taskIndex], ...updateData };

		res.status(200).json({
			success: true,
			message: 'Tarea actualizada exitosamente',
			data: tasks[taskIndex]
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Error interno del servidor',
			error: error.message
		});
	}
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Eliminar una tarea
 *     description: Elimina una tarea específica del sistema
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la tarea a eliminar
 *     responses:
 *       200:
 *         description: Tarea eliminada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Tarea no encontrada
 *       400:
 *         description: ID inválido
 */
router.delete('/:id', (req, res) => {
	try {
		const id = parseInt(req.params.id);

		if (isNaN(id)) {
			return res.status(400).json({
				success: false,
				message: 'ID inválido'
			});
		}

		const taskIndex = tasks.findIndex(t => t.id === id);

		if (taskIndex === -1) {
			return res.status(404).json({
				success: false,
				message: 'Tarea no encontrada'
			});
		}

		const deletedTask = tasks.splice(taskIndex, 1)[0];

		res.status(200).json({
			success: true,
			message: 'Tarea eliminada exitosamente',
			data: deletedTask
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Error interno del servidor',
			error: error.message
		});
	}
});

module.exports = router;

