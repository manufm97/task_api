const express = require('express');
const router = express.Router();
const db = require('../config/database');
const crypto = require('crypto');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

function mapProfile(row) {
	if (!row) return null;
	const { created_at, updated_at, ...rest } = row;
	return { ...rest, createdAt: created_at, updatedAt: updated_at };
}

/**
 * @swagger
 * components:
 *   schemas:
 *     Profile:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         guid:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - guid
 *         - name
 *         - description
 *     Permission:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         guid:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         resource:
 *           type: string
 *         action:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/profiles:
 *   get:
 *     summary: Obtener todos los perfiles
 *     description: Retorna una lista de todos los perfiles con sus permisos asociados
 *     tags: [Profiles]
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
 *         description: Número de perfiles por página
 *     responses:
 *       200:
 *         description: Lista de perfiles obtenida exitosamente
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
 *                     $ref: '#/components/schemas/Profile'
 *                 pagination:
 *                   type: object
 */
router.get('/', async (req, res) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 10;

		const [{ count }] = await db('profiles').count('* as count');
		const total = Number(count);

		const rows = await db('profiles')
			.offset((page - 1) * limit)
			.limit(limit)
			.orderBy('id', 'asc');

		const data = rows.map(mapProfile);

		res.status(200).json({
			success: true,
			data,
			pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
		});
	} catch (error) {
		res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
	}
});

/**
 * @swagger
 * /api/profiles/{guid}:
 *   get:
 *     summary: Obtener un perfil por GUID
 *     description: Retorna un perfil específico con sus permisos asociados
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: guid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: GUID del perfil
 *     responses:
 *       200:
 *         description: Perfil encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Profile'
 *       404:
 *         description: Perfil no encontrado
 */
router.get('/:guid', async (req, res) => {
	try {
		const { guid } = req.params;
		const profile = await db('profiles').where({ guid }).first();

		if (!profile) {
			return res.status(404).json({ success: false, message: 'Perfil no encontrado' });
		}

		const permissions = await db('profile_permissions')
			.join('permissions', 'profile_permissions.permission_id', 'permissions.id')
			.where('profile_permissions.profile_id', profile.id)
			.select('permissions.*');

		res.status(200).json({
			success: true,
			data: { ...mapProfile(profile), permissions: permissions.map(mapProfile) },
		});
	} catch (error) {
		res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
	}
});

/**
 * @swagger
 * /api/profiles:
 *   post:
 *     summary: Crear un nuevo perfil
 *     description: Crea un nuevo perfil en el sistema
 *     tags: [Profiles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: Nombre del perfil
 *               description:
 *                 type: string
 *                 maxLength: 255
 *                 description: Descripción del perfil
 *     responses:
 *       201:
 *         description: Perfil creado exitosamente
 *       400:
 *         description: Datos inválidos
 */
router.post('/', async (req, res) => {
	try {
		const { name, description } = req.body;

		const errors = [];

		if (!name || name.trim() === '') {
			errors.push('El nombre es obligatorio');
		} else if (name.length > 100) {
			errors.push('El nombre no puede exceder 100 caracteres');
		}

		if (description && description.length > 255) {
			errors.push('La descripción no puede exceder 255 caracteres');
		}

		if (errors.length > 0) {
			return res.status(400).json({ success: false, message: 'Datos inválidos', errors });
		}

		const guid = crypto.randomUUID();

		await db('profiles').insert({
			guid,
			name: name.trim(),
			description: description ? description.trim() : null,
			created_at: db.fn.now(),
			updated_at: db.fn.now(),
		});

		const profile = await db('profiles').where({ guid }).first();

		res.status(201).json({ success: true, message: 'Perfil creado exitosamente', data: mapProfile(profile) });
	} catch (error) {
		res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
	}
});

/**
 * @swagger
 * /api/profiles/{guid}:
 *   put:
 *     summary: Actualizar un perfil completo
 *     description: Actualiza todos los campos de un perfil existente
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: guid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: GUID del perfil
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente
 *       404:
 *         description: Perfil no encontrado
 *       400:
 *         description: Datos inválidos
 */
router.put('/:guid', async (req, res) => {
	try {
		const { guid } = req.params;
		const { name, description } = req.body;

		const existing = await db('profiles').where({ guid }).first();

		if (!existing) {
			return res.status(404).json({ success: false, message: 'Perfil no encontrado' });
		}

		const errors = [];

		if (!name || name.trim() === '') {
			errors.push('El nombre es obligatorio');
		} else if (name.length > 100) {
			errors.push('El nombre no puede exceder 100 caracteres');
		}

		if (description && description.length > 255) {
			errors.push('La descripción no puede exceder 255 caracteres');
		}

		if (errors.length > 0) {
			return res.status(400).json({ success: false, message: 'Datos inválidos', errors });
		}

		await db('profiles').where({ guid }).update({
			name: name.trim(),
			description: description ? description.trim() : null,
			updated_at: db.fn.now(),
		});

		const profile = await db('profiles').where({ guid }).first();

		res.status(200).json({ success: true, message: 'Perfil actualizado exitosamente', data: mapProfile(profile) });
	} catch (error) {
		res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
	}
});

/**
 * @swagger
 * /api/profiles/{guid}:
 *   patch:
 *     summary: Actualizar parcialmente un perfil
 *     description: Actualiza solo los campos especificados de un perfil
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: guid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: GUID del perfil
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente
 *       404:
 *         description: Perfil no encontrado
 *       400:
 *         description: Datos inválidos
 */
router.patch('/:guid', async (req, res) => {
	try {
		const { guid } = req.params;
		const { name, description } = req.body;

		const existing = await db('profiles').where({ guid }).first();

		if (!existing) {
			return res.status(404).json({ success: false, message: 'Perfil no encontrado' });
		}

		const errors = [];

		if (name !== undefined) {
			if (!name || name.trim() === '') {
				errors.push('El nombre no puede estar vacío');
			} else if (name.length > 100) {
				errors.push('El nombre no puede exceder 100 caracteres');
			}
		}

		if (description !== undefined && description.length > 255) {
			errors.push('La descripción no puede exceder 255 caracteres');
		}

		if (errors.length > 0) {
			return res.status(400).json({ success: false, message: 'Datos inválidos', errors });
		}

		const updateData = { updated_at: db.fn.now() };

		if (name !== undefined) updateData.name = name.trim();
		if (description !== undefined) updateData.description = description.trim();

		await db('profiles').where({ guid }).update(updateData);

		const profile = await db('profiles').where({ guid }).first();

		res.status(200).json({ success: true, message: 'Perfil actualizado exitosamente', data: mapProfile(profile) });
	} catch (error) {
		res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
	}
});

/**
 * @swagger
 * /api/profiles/{guid}:
 *   delete:
 *     summary: Eliminar un perfil
 *     description: Elimina un perfil específico del sistema
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: guid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: GUID del perfil a eliminar
 *     responses:
 *       200:
 *         description: Perfil eliminado exitosamente
 *       404:
 *         description: Perfil no encontrado
 */
router.delete('/:guid', async (req, res) => {
	try {
		const { guid } = req.params;

		const profile = await db('profiles').where({ guid }).first();

		if (!profile) {
			return res.status(404).json({ success: false, message: 'Perfil no encontrado' });
		}

		await db('profiles').where({ guid }).del();

		res.status(200).json({ success: true, message: 'Perfil eliminado exitosamente', data: mapProfile(profile) });
	} catch (error) {
		res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
	}
});

/**
 * @swagger
 * /api/profiles/{guid}/permissions:
 *   get:
 *     summary: Obtener permisos de un perfil
 *     description: Retorna la lista de permisos asociados a un perfil
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: guid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: GUID del perfil
 *     responses:
 *       200:
 *         description: Permisos obtenidos exitosamente
 *       404:
 *         description: Perfil no encontrado
 */
router.get('/:guid/permissions', async (req, res) => {
	try {
		const { guid } = req.params;

		const profile = await db('profiles').where({ guid }).first();

		if (!profile) {
			return res.status(404).json({ success: false, message: 'Perfil no encontrado' });
		}

		const permissions = await db('profile_permissions')
			.join('permissions', 'profile_permissions.permission_id', 'permissions.id')
			.where('profile_permissions.profile_id', profile.id)
			.select('permissions.*');

		res.status(200).json({ success: true, data: permissions.map(mapProfile) });
	} catch (error) {
		res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
	}
});

/**
 * @swagger
 * /api/profiles/{guid}/permissions:
 *   post:
 *     summary: Asignar permiso a un perfil
 *     description: Asigna un permiso existente a un perfil
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: guid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: GUID del perfil
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissionGuid
 *             properties:
 *               permissionGuid:
 *                 type: string
 *                 format: uuid
 *                 description: GUID del permiso a asignar
 *     responses:
 *       201:
 *         description: Permiso asignado exitosamente
 *       404:
 *         description: Perfil o permiso no encontrado
 *       409:
 *         description: El permiso ya está asignado al perfil
 */
router.post('/:guid/permissions', async (req, res) => {
	try {
		const { guid } = req.params;
		const { permissionGuid } = req.body;

		const profile = await db('profiles').where({ guid }).first();

		if (!profile) {
			return res.status(404).json({ success: false, message: 'Perfil no encontrado' });
		}

		if (!permissionGuid) {
			return res.status(400).json({ success: false, message: 'El GUID del permiso es obligatorio' });
		}

		const permission = await db('permissions').where({ guid: permissionGuid }).first();

		if (!permission) {
			return res.status(404).json({ success: false, message: 'Permiso no encontrado' });
		}

		const existing = await db('profile_permissions')
			.where({ profile_id: profile.id, permission_id: permission.id })
			.first();

		if (existing) {
			return res.status(409).json({ success: false, message: 'El permiso ya está asignado a este perfil' });
		}

		await db('profile_permissions').insert({
			profile_id: profile.id,
			permission_id: permission.id,
			created_at: db.fn.now(),
		});

		res.status(201).json({ success: true, message: 'Permiso asignado exitosamente' });
	} catch (error) {
		res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
	}
});

/**
 * @swagger
 * /api/profiles/{guid}/permissions/{permGuid}:
 *   delete:
 *     summary: Eliminar permiso de un perfil
 *     description: Elimina la asignación de un permiso a un perfil
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: guid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: GUID del perfil
 *       - in: path
 *         name: permGuid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: GUID del permiso
 *     responses:
 *       200:
 *         description: Permiso eliminado del perfil exitosamente
 *       404:
 *         description: Perfil, permiso o asignación no encontrada
 */
router.delete('/:guid/permissions/:permGuid', async (req, res) => {
	try {
		const { guid, permGuid } = req.params;

		const profile = await db('profiles').where({ guid }).first();

		if (!profile) {
			return res.status(404).json({ success: false, message: 'Perfil no encontrado' });
		}

		const permission = await db('permissions').where({ guid: permGuid }).first();

		if (!permission) {
			return res.status(404).json({ success: false, message: 'Permiso no encontrado' });
		}

		const existing = await db('profile_permissions')
			.where({ profile_id: profile.id, permission_id: permission.id })
			.first();

		if (!existing) {
			return res.status(404).json({ success: false, message: 'El permiso no está asignado a este perfil' });
		}

		await db('profile_permissions').where({ id: existing.id }).del();

		res.status(200).json({ success: true, message: 'Permiso eliminado del perfil exitosamente' });
	} catch (error) {
		res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
	}
});

module.exports = router;
