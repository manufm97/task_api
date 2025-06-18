/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
	return knex.schema
		.createTable('users', (table) => {
			table.string('id').primary();
			table.string('user_name').notNullable();
			table.string('first_name').notNullable();
			table.string('last_name_1').notNullable();
			table.string('last_name_2');
			table.string('email').notNullable().unique();
			table.string('password').notNullable();
			table.boolean('active').defaultTo(false);
			table.timestamp('created_at').defaultTo(knex.fn.now());
			table.timestamp('updated_at').defaultTo(knex.fn.now());
		})

		.createTable('priorities', (table) => {
			table.increments('id').primary();
			table.string('description').notNullable();
			table.string('color').notNullable();
			table.timestamp('created_at').defaultTo(knex.fn.now());
			table.timestamp('updated_at').defaultTo(knex.fn.now());
		})

		.createTable('statuses', (table) => {
			table.increments('id').primary();
			table.string('description').notNullable();
			table.string('color').notNullable();
			table.timestamp('created_at').defaultTo(knex.fn.now());
			table.timestamp('updated_at').defaultTo(knex.fn.now());
		})

		.createTable('tasks', (table) => {
			table.string('id').primary();
			table.string('title').notNullable();
			table.text('description');
			table.integer('priority_id').unsigned().references('id').inTable('priorities').onDelete('SET NULL');
			table.timestamp('created_at').defaultTo(knex.fn.now());
			table.timestamp('updated_at').defaultTo(knex.fn.now());
		})

		.createTable('task_status_history', (table) => {
			table.increments('id').primary();
			table.string('task_id').references('id').inTable('tasks').onDelete('CASCADE');
			table.integer('status_id').unsigned().references('id').inTable('statuses').onDelete('SET NULL');
			table.string('user_id').references('id').inTable('users').onDelete('SET NULL');
			table.timestamp('created_at').defaultTo(knex.fn.now());
			table.timestamp('updated_at').defaultTo(knex.fn.now());
		})

		.createTable('task_comments', (table) => {
			table.string('id').primary();
			table.string('task_id').references('id').inTable('tasks').onDelete('CASCADE');
			table.string('user_id').references('id').inTable('users').onDelete('SET NULL');
			table.text('comment').notNullable();
			table.timestamp('created_at').defaultTo(knex.fn.now());
			table.timestamp('updated_at').defaultTo(knex.fn.now());
		})

		.createTable('task_attachments', (table) => {
			table.string('id').primary();
			table.string('task_id').references('id').inTable('tasks').onDelete('CASCADE');
			table.string('user_id').references('id').inTable('users').onDelete('SET NULL');
			table.string('file_name').notNullable();
			table.string('file_path').notNullable();
			table.timestamp('created_at').defaultTo(knex.fn.now());
			table.timestamp('updated_at').defaultTo(knex.fn.now());
		});
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
	return knex.schema
		.dropTableIfExists('task_attachments')
		.dropTableIfExists('task_comments')
		.dropTableIfExists('task_status_history')
		.dropTableIfExists('users')
		.dropTableIfExists('tasks')
		.dropTableIfExists('priorities')
		.dropTableIfExists('statuses');
};
