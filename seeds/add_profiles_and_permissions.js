const crypto = require('crypto');

exports.seed = async function (knex) {
	// Clear in FK order
	await knex('profile_permissions').del();
	await knex('permissions').del();

	// ── Permissions ──────────────────────────────────────────
	const permissions = [
		{ guid: crypto.randomUUID(), name: 'Crear tareas', description: 'Permite crear nuevas tareas', resource: 'tasks', action: 'create' },
		{ guid: crypto.randomUUID(), name: 'Ver tareas', description: 'Permite listar y ver tareas', resource: 'tasks', action: 'read' },
		{ guid: crypto.randomUUID(), name: 'Actualizar tareas', description: 'Permite modificar tareas existentes', resource: 'tasks', action: 'update' },
		{ guid: crypto.randomUUID(), name: 'Eliminar tareas', description: 'Permite eliminar tareas', resource: 'tasks', action: 'delete' },
		{ guid: crypto.randomUUID(), name: 'Crear usuarios', description: 'Permite crear nuevos usuarios', resource: 'users', action: 'create' },
		{ guid: crypto.randomUUID(), name: 'Ver usuarios', description: 'Permite listar y ver usuarios', resource: 'users', action: 'read' },
		{ guid: crypto.randomUUID(), name: 'Actualizar usuarios', description: 'Permite modificar usuarios existentes', resource: 'users', action: 'update' },
		{ guid: crypto.randomUUID(), name: 'Eliminar usuarios', description: 'Permite eliminar usuarios', resource: 'users', action: 'delete' },
		{ guid: crypto.randomUUID(), name: 'Gestionar perfiles', description: 'Permite gestionar perfiles de usuario', resource: 'profiles', action: 'manage' },
		{ guid: crypto.randomUUID(), name: 'Gestionar permisos', description: 'Permite gestionar permisos del sistema', resource: 'permissions', action: 'manage' },
	];

	await knex('permissions').insert(permissions);

	// ── Profiles ─────────────────────────────────────────────
	let existingProfiles = await knex('profiles').select('*');

	let adminId, userId, viewerId;

	const profileData = [
		{ name: 'Admin', description: 'Administrador del sistema con acceso completo' },
		{ name: 'User', description: 'Usuario estándar del sistema' },
		{ name: 'Viewer', description: 'Usuario de solo lectura' },
	];

	if (existingProfiles.length === 0) {
		const toInsert = profileData.map(p => ({ guid: crypto.randomUUID(), ...p }));
		await knex('profiles').insert(toInsert);
		existingProfiles = await knex('profiles').orderBy('id').select('*');
	} else {
		for (let i = 0; i < existingProfiles.length; i++) {
			const data = profileData[i] || { name: `Profile ${i + 1}`, description: existingProfiles[i].description };
			await knex('profiles').where({ id: existingProfiles[i].id }).update(data);
		}
	}

	adminId = existingProfiles[0]?.id;
	userId = existingProfiles[1]?.id;
	viewerId = existingProfiles[2]?.id;

	// ── Profile-Permissions ──────────────────────────────────
	const allPerms = await knex('permissions').select('*');

	const taskPermIds = allPerms.filter(p => p.resource === 'tasks').map(p => p.id);
	const userReadPermIds = allPerms.filter(p => p.resource === 'users' && p.action === 'read').map(p => p.id);
	const taskReadPermIds = allPerms.filter(p => p.resource === 'tasks' && p.action === 'read').map(p => p.id);

	const profilePerms = [];

	// Admin: all permissions
	for (const p of allPerms) {
		profilePerms.push({ profile_id: adminId, permission_id: p.id, created_at: knex.fn.now() });
	}

	// User: tasks CRUD + users read
	for (const id of [...taskPermIds, ...userReadPermIds]) {
		profilePerms.push({ profile_id: userId, permission_id: id, created_at: knex.fn.now() });
	}

	// Viewer: tasks read only
	for (const id of taskReadPermIds) {
		profilePerms.push({ profile_id: viewerId, permission_id: id, created_at: knex.fn.now() });
	}

	await knex('profile_permissions').insert(profilePerms);
};
