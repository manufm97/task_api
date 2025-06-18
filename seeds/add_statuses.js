/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('statuses').del()
  await knex('statuses').insert([
    {id: 1, description: 'Created', color: '#FFFF80'},
    {id: 2, description: 'Assigned', color: '#0080FF'},
    {id: 3, description: 'In Progress', color: '#FFAD5B'},
    {id: 4, description: 'Completed', color: '#77FF77'},
  ]);
};
