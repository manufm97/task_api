const express = require('express');
const router = express.Router();
const db = require('../config/database');
const crypto = require('crypto');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');

function mapUser(user) {
	if (!user) return null;
	const { password, created_at, updated_at, ...rest } = user;
	return { ...rest, createdAt: created_at, updatedAt: updated_at };
}

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: GUID del usuario
 *         user_name:
 *           type: string
 *           description: Nombre de usuario
 *         first_name:
 *           type: string
 *           description: Primer nombre
 *         last_name_1:
 *           type: string
 *           description: Primer apellido
 *         last_name_2:
 *           type: string
 *           description: Segundo apellido
 *         email:
 *           type: string
 *           format: email
 *           description: Correo electrónico
 *         password:
 *           type: string
 *           description: Contraseña
 *         active:
 *           type: boolean
 *           description: Estado activo
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - id
 *         - user_name
 *         - first_name
 *         - last_name_1
 *         - email
 *         - password
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Obtener todos los usuarios
 *     description: Retorna una lista de todos los usuarios con paginación opcional
 *     tags: [Users]
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
 *         description: Número de usuarios por página
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo
 *     responses:
 *       200:
 *         description: Lista de usuarios obtenida exitosamente
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
 *                     $ref: '#/components/schemas/User'
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
		const active = req.query.active;

		let query = db('users');
		let countQuery = db('users');

		if (active !== undefined) {
			const isActive = active === 'true';
			query = query.where('active', isActive);
			countQuery = countQuery.where('active', isActive);
		}

		const [{ count }] = await countQuery.count('* as count');
		const total = Number(count);

		const rows = await query
			.offset((page - 1) * limit)
			.limit(limit)
			.orderBy('created_at', 'desc');

		const data = rows.map(mapUser);

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
 * /api/users/{guid}:
 *   get:
 *     summary: Obtener un usuario por GUID
 *     description: Retorna un usuario específico por su GUID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: guid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: GUID del usuario
 *     responses:
 *       200:
 *         description: Usuario encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: Usuario no encontrado
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

		const user = await db('users').where({ guid }).first();

		if (!user) {
			return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
		}

		res.status(200).json({ success: true, data: mapUser(user) });
	} catch (error) {
		res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
	}
});

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Iniciar sesión
 *     description: Autentica un usuario con email y contraseña
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Correo electrónico
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Contraseña
 *     responses:
 *       200:
 *         description: Login exitoso
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
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Credenciales inválidas
 *       400:
 *         description: Datos inválidos
 */
router.post('/login', async (req, res) => {
	try {
		const { email, password } = req.body;

		const errors = [];

		if (!email || email.trim() === '') {
			errors.push('El correo electrónico es obligatorio');
		} else if (!/\S+@\S+\.\S+/.test(email)) {
			errors.push('El correo electrónico no es válido');
		}

		if (!password || password.trim() === '') {
			errors.push('La contraseña es obligatoria');
		}

		if (errors.length > 0) {
			return res.status(400).json({ success: false, message: 'Datos inválidos', errors });
		}

		const user = await db('users').where({ email: email.trim().toLowerCase() }).first();

		if (!user) {
			return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
		}

		const validPassword = await argon2.verify(user.password, password);

		if (!validPassword) {
			return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
		}

		const token = jwt.sign(
			{ guid: user.guid, email: user.email },
			process.env.JWT_SECRET,
			{ expiresIn: '1h' }
		);

		res.status(200).json({ success: true, message: 'Login exitoso', sessionToken: token, data: mapUser(user) });
	} catch (error) {
		res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
	}
});

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Crear un nuevo usuario
 *     description: Crea un nuevo usuario en el sistema
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_name
 *               - first_name
 *               - last_name_1
 *               - email
 *               - password
 *             properties:
 *               user_name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 50
 *                 description: Nombre de usuario
 *               first_name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: Primer nombre
 *               last_name_1:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: Primer apellido
 *               last_name_2:
 *                 type: string
 *                 maxLength: 100
 *                 description: Segundo apellido
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Correo electrónico
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Contraseña
 *               active:
 *                 type: boolean
 *                 default: false
 *                 description: Estado activo
 *             example:
 *               user_name: "john_doe"
 *               first_name: "John"
 *               last_name_1: "Doe"
 *               last_name_2: "Smith"
 *               email: "john.doe@example.com"
 *               password: "password123"
 *               active: true
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
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
 *                   $ref: '#/components/schemas/User'
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
		const { user_name, first_name, last_name_1, last_name_2, email, password, active } = req.body;

		const errors = [];

		if (!user_name || user_name.trim() === '') {
			errors.push('El nombre de usuario es obligatorio');
		} else if (user_name.length > 50) {
			errors.push('El nombre de usuario no puede exceder 50 caracteres');
		}

		if (!first_name || first_name.trim() === '') {
			errors.push('El primer nombre es obligatorio');
		} else if (first_name.length > 100) {
			errors.push('El primer nombre no puede exceder 100 caracteres');
		}

		if (!last_name_1 || last_name_1.trim() === '') {
			errors.push('El primer apellido es obligatorio');
		} else if (last_name_1.length > 100) {
			errors.push('El primer apellido no puede exceder 100 caracteres');
		}

		if (last_name_2 && last_name_2.length > 100) {
			errors.push('El segundo apellido no puede exceder 100 caracteres');
		}

		if (!email || email.trim() === '') {
			errors.push('El correo electrónico es obligatorio');
		} else if (!/\S+@\S+\.\S+/.test(email)) {
			errors.push('El correo electrónico no es válido');
		}

		if (!password || password.length < 6) {
			errors.push('La contraseña debe tener al menos 6 caracteres');
		}

		if (errors.length > 0) {
			return res.status(400).json({ success: false, message: 'Datos inválidos', errors });
		}

		const passwordHash = await argon2.hash(password);
		const guid = crypto.randomUUID();

		await db('users').insert({
			guid,
			user_name: user_name.trim(),
			first_name: first_name.trim(),
			last_name_1: last_name_1.trim(),
			last_name_2: last_name_2 ? last_name_2.trim() : null,
			email: email.trim().toLowerCase(),
			password: passwordHash,
			active: active || false,
			created_at: db.fn.now(),
			updated_at: db.fn.now(),
		});

		const user = await db('users').where({ guid }).first();

		res.status(201).json({
			success: true,
			message: 'Usuario creado exitosamente',
			data: mapUser(user),
		});
	} catch (error) {
		if (error.code === 'ER_DUP_ENTRY') {
			return res.status(409).json({ success: false, message: 'El email o nombre de usuario ya existe' });
		}
		res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
	}
});

/**
 * @swagger
 * /api/users/{guid}:
 *   put:
 *     summary: Actualizar un usuario completo
 *     description: Actualiza todos los campos de un usuario existente
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: guid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: GUID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_name
 *               - first_name
 *               - last_name_1
 *               - email
 *               - password
 *             properties:
 *               user_name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 50
 *               first_name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               last_name_1:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               last_name_2:
 *                 type: string
 *                 maxLength: 100
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente
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
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: Usuario no encontrado
 *       400:
 *         description: Datos inválidos
 */
router.put('/:guid', async (req, res) => {
	try {
		const { guid } = req.params;
		const { user_name, first_name, last_name_1, last_name_2, email, password, active } = req.body;

		const existing = await db('users').where({ guid }).first();

		if (!existing) {
			return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
		}

		const errors = [];

		if (!user_name || user_name.trim() === '') {
			errors.push('El nombre de usuario es obligatorio');
		} else if (user_name.length > 50) {
			errors.push('El nombre de usuario no puede exceder 50 caracteres');
		}

		if (!first_name || first_name.trim() === '') {
			errors.push('El primer nombre es obligatorio');
		} else if (first_name.length > 100) {
			errors.push('El primer nombre no puede exceder 100 caracteres');
		}

		if (!last_name_1 || last_name_1.trim() === '') {
			errors.push('El primer apellido es obligatorio');
		} else if (last_name_1.length > 100) {
			errors.push('El primer apellido no puede exceder 100 caracteres');
		}

		if (last_name_2 && last_name_2.length > 100) {
			errors.push('El segundo apellido no puede exceder 100 caracteres');
		}

		if (!email || email.trim() === '') {
			errors.push('El correo electrónico es obligatorio');
		} else if (!/\S+@\S+\.\S+/.test(email)) {
			errors.push('El correo electrónico no es válido');
		}

		if (password && password.length < 6) {
			errors.push('La contraseña debe tener al menos 6 caracteres');
		}

		if (errors.length > 0) {
			return res.status(400).json({ success: false, message: 'Datos inválidos', errors });
		}

		const updateData = {
			user_name: user_name.trim(),
			first_name: first_name.trim(),
			last_name_1: last_name_1.trim(),
			last_name_2: last_name_2 ? last_name_2.trim() : null,
			email: email.trim().toLowerCase(),
			active: active !== undefined ? active : existing.active,
			updated_at: db.fn.now(),
		};

		if (password) {
			updateData.password = await argon2.hash(password);
		}

		await db('users').where({ guid }).update(updateData);

		const user = await db('users').where({ guid }).first();

		res.status(200).json({ success: true, message: 'Usuario actualizado exitosamente', data: mapUser(user) });
	} catch (error) {
		if (error.code === 'ER_DUP_ENTRY') {
			return res.status(409).json({ success: false, message: 'El email o nombre de usuario ya existe' });
		}
		res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
	}
});

/**
 * @swagger
 * /api/users/{guid}:
 *   patch:
 *     summary: Actualizar parcialmente un usuario
 *     description: Actualiza solo los campos especificados de un usuario
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: guid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: GUID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 50
 *               first_name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               last_name_1:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               last_name_2:
 *                 type: string
 *                 maxLength: 100
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente
 *       404:
 *         description: Usuario no encontrado
 *       400:
 *         description: Datos inválidos
 */
router.patch('/:guid', async (req, res) => {
	try {
		const { guid } = req.params;
		const { user_name, first_name, last_name_1, last_name_2, email, password, active } = req.body;

		const existing = await db('users').where({ guid }).first();

		if (!existing) {
			return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
		}

		const errors = [];

		if (user_name !== undefined) {
			if (!user_name || user_name.trim() === '') {
				errors.push('El nombre de usuario no puede estar vacío');
			} else if (user_name.length > 50) {
				errors.push('El nombre de usuario no puede exceder 50 caracteres');
			}
		}

		if (first_name !== undefined) {
			if (!first_name || first_name.trim() === '') {
				errors.push('El primer nombre no puede estar vacío');
			} else if (first_name.length > 100) {
				errors.push('El primer nombre no puede exceder 100 caracteres');
			}
		}

		if (last_name_1 !== undefined) {
			if (!last_name_1 || last_name_1.trim() === '') {
				errors.push('El primer apellido no puede estar vacío');
			} else if (last_name_1.length > 100) {
				errors.push('El primer apellido no puede exceder 100 caracteres');
			}
		}

		if (last_name_2 !== undefined && last_name_2.length > 100) {
			errors.push('El segundo apellido no puede exceder 100 caracteres');
		}

		if (email !== undefined) {
			if (!email || email.trim() === '') {
				errors.push('El correo electrónico no puede estar vacío');
			} else if (!/\S+@\S+\.\S+/.test(email)) {
				errors.push('El correo electrónico no es válido');
			}
		}

		if (password !== undefined && password.length < 6) {
			errors.push('La contraseña debe tener al menos 6 caracteres');
		}

		if (errors.length > 0) {
			return res.status(400).json({ success: false, message: 'Datos inválidos', errors });
		}

		const updateData = { updated_at: db.fn.now() };

		if (user_name !== undefined) updateData.user_name = user_name.trim();
		if (first_name !== undefined) updateData.first_name = first_name.trim();
		if (last_name_1 !== undefined) updateData.last_name_1 = last_name_1.trim();
		if (last_name_2 !== undefined) updateData.last_name_2 = last_name_2.trim();
		if (email !== undefined) updateData.email = email.trim().toLowerCase();
		if (password !== undefined) updateData.password = await argon2.hash(password);
		if (active !== undefined) updateData.active = active;

		await db('users').where({ guid }).update(updateData);

		const user = await db('users').where({ guid }).first();

		res.status(200).json({ success: true, message: 'Usuario actualizado exitosamente', data: mapUser(user) });
	} catch (error) {
		if (error.code === 'ER_DUP_ENTRY') {
			return res.status(409).json({ success: false, message: 'El email o nombre de usuario ya existe' });
		}
		res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
	}
});

/**
 * @swagger
 * /api/users/{guid}:
 *   delete:
 *     summary: Eliminar un usuario
 *     description: Elimina un usuario específico del sistema
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: guid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: GUID del usuario a eliminar
 *     responses:
 *       200:
 *         description: Usuario eliminado exitosamente
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
 *         description: Usuario no encontrado
 *       400:
 *         description: GUID inválido
 */
router.delete('/:guid', async (req, res) => {
	try {
		const { guid } = req.params;

		const user = await db('users').where({ guid }).first();

		if (!user) {
			return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
		}

		await db('users').where({ guid }).del();

		res.status(200).json({ success: true, message: 'Usuario eliminado exitosamente', data: mapUser(user) });
	} catch (error) {
		res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
	}
});

module.exports = router;
