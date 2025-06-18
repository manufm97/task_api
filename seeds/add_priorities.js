/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('priorities').del()
  await knex('priorities').insert([
    {id: 1, description: 'Very low', color: '#A4FFA4'},
    {id: 2, description: 'Low', color: '#46FF46'},
    {id: 3, description: 'Medium', color: '#FFFF00'},
    {id: 4, description: 'High', color: '#FF0000'},
    {id: 5, description: 'Very high', color: '#8A0000'},
    {id: 6, description: 'Critical', color: '#FF00FF'},
    {id: 7, description: 'Immediate', color: '#480000'},
    {id: 8, description: 'Urgent', color: '#400080'},
  ]);
};
