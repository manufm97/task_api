const express = require('express');
const router = express.Router();
const db = require('../config/database');
const crypto = require('crypto');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

function mapTask(task) {
	if (!task) return null;
	const { created_at, updated_at, ...rest } = task;
	return { ...rest, createdAt: created_at, updatedAt: updated_at };
}

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
 *         name: priority_id
 *         schema:
 *           type: integer
 *         description: Filtrar por prioridad
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
router.get('/', async (req, res) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 10;
		const priority_id = req.query.priority_id;

		let query = db('tasks');
		let countQuery = db('tasks');

		if (priority_id !== undefined) {
			const pid = parseInt(priority_id);
			query = query.where('priority_id', pid);
			countQuery = countQuery.where('priority_id', pid);
		}

		const [{ count }] = await countQuery.count('* as count');
		const total = Number(count);

		const rows = await query
			.offset((page - 1) * limit)
			.limit(limit)
			.orderBy('created_at', 'desc');

		res.status(200).json({
			success: true,
			data: rows.map(mapTask),
			pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
		});
	} catch (error) {
		res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
	}
});

/**
 * @swagger
 * /api/tasks/{guid}:
 *   get:
 *     summary: Obtener una tarea por GUID
 *     description: Retorna una tarea específica por su GUID
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: guid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: GUID de la tarea
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
router.get('/:guid', async (req, res) => {
	try {
		const { guid } = req.params;
		const task = await db('tasks').where({ guid }).first();

		if (!task) {
			return res.status(404).json({ success: false, message: 'Tarea no encontrada' });
		}

		res.status(200).json({ success: true, data: mapTask(task) });
	} catch (error) {
		res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
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
 *               priority_id:
 *                 type: integer
 *                 description: ID de la prioridad
 *             example:
 *               title: "Nueva tarea"
 *               description: "Descripción de la nueva tarea"
 *               priority_id: 1
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
router.post('/', async (req, res) => {
	try {
		const { title, description, priority_id } = req.body;

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
			return res.status(400).json({ success: false, message: 'Datos inválidos', errors });
		}

		const guid = crypto.randomUUID();

		await db('tasks').insert({
			guid,
			title: title.trim(),
			description: description ? description.trim() : null,
			priority_id: priority_id || null,
			created_at: db.fn.now(),
			updated_at: db.fn.now(),
		});

		const task = await db('tasks').where({ guid }).first();

		res.status(201).json({
			success: true,
			message: 'Tarea creada exitosamente',
			data: mapTask(task),
		});
	} catch (error) {
		res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
	}
});

/**
 * @swagger
 * /api/tasks/{guid}:
 *   put:
 *     summary: Actualizar una tarea completa
 *     description: Actualiza todos los campos de una tarea existente
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: guid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: GUID de la tarea
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
 *               priority_id:
 *                 type: integer
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
router.put('/:guid', async (req, res) => {
	try {
		const { guid } = req.params;
		const { title, description, priority_id } = req.body;

		const existing = await db('tasks').where({ guid }).first();

		if (!existing) {
			return res.status(404).json({ success: false, message: 'Tarea no encontrada' });
		}

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
			return res.status(400).json({ success: false, message: 'Datos inválidos', errors });
		}

		await db('tasks').where({ guid }).update({
			title: title.trim(),
			description: description ? description.trim() : null,
			priority_id: priority_id !== undefined ? priority_id : existing.priority_id,
			updated_at: db.fn.now(),
		});

		const task = await db('tasks').where({ guid }).first();

		res.status(200).json({ success: true, message: 'Tarea actualizada exitosamente', data: mapTask(task) });
	} catch (error) {
		res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
	}
});

/**
 * @swagger
 * /api/tasks/{guid}:
 *   patch:
 *     summary: Actualizar parcialmente una tarea
 *     description: Actualiza solo los campos especificados de una tarea
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: guid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: GUID de la tarea
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
 *               priority_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Tarea actualizada exitosamente
 *       404:
 *         description: Tarea no encontrada
 *       400:
 *         description: Datos inválidos
 */
router.patch('/:guid', async (req, res) => {
	try {
		const { guid } = req.params;
		const { title, description, priority_id } = req.body;

		const existing = await db('tasks').where({ guid }).first();

		if (!existing) {
			return res.status(404).json({ success: false, message: 'Tarea no encontrada' });
		}

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
			return res.status(400).json({ success: false, message: 'Datos inválidos', errors });
		}

		const updateData = { updated_at: db.fn.now() };

		if (title !== undefined) updateData.title = title.trim();
		if (description !== undefined) updateData.description = description.trim();
		if (priority_id !== undefined) updateData.priority_id = priority_id;

		await db('tasks').where({ guid }).update(updateData);

		const task = await db('tasks').where({ guid }).first();

		res.status(200).json({ success: true, message: 'Tarea actualizada exitosamente', data: mapTask(task) });
	} catch (error) {
		res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
	}
});

/**
 * @swagger
 * /api/tasks/{guid}:
 *   delete:
 *     summary: Eliminar una tarea
 *     description: Elimina una tarea específica del sistema
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: guid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: GUID de la tarea a eliminar
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
 *         description: GUID inválido
 */
router.delete('/:guid', async (req, res) => {
	try {
		const { guid } = req.params;

		const task = await db('tasks').where({ guid }).first();

		if (!task) {
			return res.status(404).json({ success: false, message: 'Tarea no encontrada' });
		}

		await db('tasks').where({ guid }).del();

		res.status(200).json({ success: true, message: 'Tarea eliminada exitosamente', data: mapTask(task) });
	} catch (error) {
		res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
	}
});

module.exports = router;
