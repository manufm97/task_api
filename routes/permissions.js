const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

function mapPermission(row) {
	if (!row) return null;
	const { created_at, updated_at, ...rest } = row;
	return { ...rest, createdAt: created_at, updatedAt: updated_at };
}

/**
 * @swagger
 * /api/permissions:
 *   get:
 *     summary: Obtener todos los permisos
 *     description: Retorna una lista de todos los permisos disponibles en el sistema
 *     tags: [Permissions]
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
 *           default: 50
 *         description: Número de permisos por página
 *       - in: query
 *         name: resource
 *         schema:
 *           type: string
 *         description: Filtrar por recurso (tasks, users, profiles, permissions)
 *     responses:
 *       200:
 *         description: Lista de permisos obtenida exitosamente
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
 *                     $ref: '#/components/schemas/Permission'
 *                 pagination:
 *                   type: object
 */
router.get('/', async (req, res) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 50;
		const resource = req.query.resource;

		let query = db('permissions');
		let countQuery = db('permissions');

		if (resource) {
			query = query.where('resource', resource);
			countQuery = countQuery.where('resource', resource);
		}

		const [{ count }] = await countQuery.count('* as count');
		const total = Number(count);

		const rows = await query
			.offset((page - 1) * limit)
			.limit(limit)
			.orderBy('resource', 'asc')
			.orderBy('id', 'asc');

		res.status(200).json({
			success: true,
			data: rows.map(mapPermission),
			pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
		});
	} catch (error) {
		res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
	}
});

/**
 * @swagger
 * /api/permissions/{guid}:
 *   get:
 *     summary: Obtener un permiso por GUID
 *     description: Retorna un permiso específico por su GUID
 *     tags: [Permissions]
 *     parameters:
 *       - in: path
 *         name: guid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: GUID del permiso
 *     responses:
 *       200:
 *         description: Permiso encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Permission'
 *       404:
 *         description: Permiso no encontrado
 */
router.get('/:guid', async (req, res) => {
	try {
		const { guid } = req.params;
		const permission = await db('permissions').where({ guid }).first();

		if (!permission) {
			return res.status(404).json({ success: false, message: 'Permiso no encontrado' });
		}

		res.status(200).json({ success: true, data: mapPermission(permission) });
	} catch (error) {
		res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
	}
});

module.exports = router;
