const express = require('express');
const router = express.Router();
const db = require('../config/database');
const crypto = require('crypto');
const argon2 = require('argon2');

let users = [];

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
router.get('/', (req, res) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 10;
		const active = req.query.active;

		let filteredUsers = users;

		if (active !== undefined) {
			const isActive = active === 'true';
			filteredUsers = users.filter(user => user.active === isActive);
		}

		const startIndex = (page - 1) * limit;
		const endIndex = startIndex + limit;
		const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

		const total = filteredUsers.length;
		const totalPages = Math.ceil(total / limit);

		const usersWithoutPassword = paginatedUsers.map(({ password, ...rest }) => rest);

		res.status(200).json({
			success: true,
			data: usersWithoutPassword,
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
router.get('/:guid', (req, res) => {
	try {
		const { guid } = req.params;

		const user = users.find(u => u.id === guid);

		if (!user) {
			return res.status(404).json({
				success: false,
				message: 'Usuario no encontrado'
			});
		}

		const { password, ...userWithoutPassword } = user;

		res.status(200).json({
			success: true,
			data: userWithoutPassword
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
			return res.status(400).json({
				success: false,
				message: 'Datos inválidos',
				errors
			});
		}

		const user = users.find(u => u.email === email.trim().toLowerCase());

		if (!user) {
			return res.status(401).json({
				success: false,
				message: 'Credenciales inválidas'
			});
		}

		const validPassword = await argon2.verify(user.password, password);

		if (!validPassword) {
			return res.status(401).json({
				success: false,
				message: 'Credenciales inválidas'
			});
		}

		const { password: _, ...userWithoutPassword } = user;

		res.status(200).json({
			success: true,
			message: 'Login exitoso',
			data: userWithoutPassword
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
			return res.status(400).json({
				success: false,
				message: 'Datos inválidos',
				errors
			});
		}

		const passwordHash = await argon2.hash(password);

		const newUser = {
			id: crypto.randomUUID(),
			user_name: user_name.trim(),
			first_name: first_name.trim(),
			last_name_1: last_name_1.trim(),
			last_name_2: last_name_2 ? last_name_2.trim() : '',
			email: email.trim(),
			password: passwordHash,
			active: active || false,
			createdAt: new Date(),
			updatedAt: new Date()
		};

		users.push(newUser);

		const { password: _, ...userWithoutPassword } = newUser;

		res.status(201).json({
			success: true,
			message: 'Usuario creado exitosamente',
			data: userWithoutPassword
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

		const userIndex = users.findIndex(u => u.id === guid);

		if (userIndex === -1) {
			return res.status(404).json({
				success: false,
				message: 'Usuario no encontrado'
			});
		}

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

		if (password && password.length < 6) {
			errors.push('La contraseña debe tener al menos 6 caracteres');
		}

		if (errors.length > 0) {
			return res.status(400).json({
				success: false,
				message: 'Datos inválidos',
				errors
			});
		}

		const passwordHash = password ? await argon2.hash(password) : users[userIndex].password;

		users[userIndex] = {
			...users[userIndex],
			user_name: user_name.trim(),
			first_name: first_name.trim(),
			last_name_1: last_name_1.trim(),
			last_name_2: last_name_2 ? last_name_2.trim() : '',
			email: email.trim(),
			password: passwordHash,
			active: active !== undefined ? active : users[userIndex].active,
			updatedAt: new Date()
		};

		const { password: _, ...userWithoutPassword } = users[userIndex];

		res.status(200).json({
			success: true,
			message: 'Usuario actualizado exitosamente',
			data: userWithoutPassword
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

		const userIndex = users.findIndex(u => u.id === guid);

		if (userIndex === -1) {
			return res.status(404).json({
				success: false,
				message: 'Usuario no encontrado'
			});
		}

		const { user_name, first_name, last_name_1, last_name_2, email, password, active } = req.body;

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
			return res.status(400).json({
				success: false,
				message: 'Datos inválidos',
				errors
			});
		}

		const updateData = { updatedAt: new Date() };

		if (user_name !== undefined) updateData.user_name = user_name.trim();
		if (first_name !== undefined) updateData.first_name = first_name.trim();
		if (last_name_1 !== undefined) updateData.last_name_1 = last_name_1.trim();
		if (last_name_2 !== undefined) updateData.last_name_2 = last_name_2.trim();
		if (email !== undefined) updateData.email = email.trim();
		if (password !== undefined) updateData.password = await argon2.hash(password);
		if (active !== undefined) updateData.active = active;

		users[userIndex] = { ...users[userIndex], ...updateData };

		const { password: _, ...userWithoutPassword } = users[userIndex];

		res.status(200).json({
			success: true,
			message: 'Usuario actualizado exitosamente',
			data: userWithoutPassword
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
router.delete('/:guid', (req, res) => {
	try {
		const { guid } = req.params;

		const userIndex = users.findIndex(u => u.id === guid);

		if (userIndex === -1) {
			return res.status(404).json({
				success: false,
				message: 'Usuario no encontrado'
			});
		}

		const deletedUser = users.splice(userIndex, 1)[0];

		res.status(200).json({
			success: true,
			message: 'Usuario eliminado exitosamente',
			data: deletedUser
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
