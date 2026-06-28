exports.up = function (knex) {
	return knex.schema
		.alterTable('profiles', (table) => {
			table.string('name', 100).after('guid');
		})

		.createTable('permissions', (table) => {
			table.increments('id').primary();
			table.string('guid', 36).notNullable().unique();
			table.string('name', 100).notNullable();
			table.string('description', 255).notNullable();
			table.string('resource', 50).notNullable();
			table.string('action', 50).notNullable();
			table.timestamp('created_at').defaultTo(knex.fn.now());
			table.timestamp('updated_at').defaultTo(knex.fn.now());
		})

		.createTable('profile_permissions', (table) => {
			table.increments('id').primary();
			table.integer('profile_id').unsigned().notNullable().references('id').inTable('profiles').onDelete('CASCADE');
			table.integer('permission_id').unsigned().notNullable().references('id').inTable('permissions').onDelete('CASCADE');
			table.timestamp('created_at').defaultTo(knex.fn.now());
			table.unique(['profile_id', 'permission_id']);
		});
};

exports.down = function (knex) {
	return knex.schema
		.dropTableIfExists('profile_permissions')
		.dropTableIfExists('permissions')
		.alterTable('profiles', (table) => {
			table.dropColumn('name');
		});
};
