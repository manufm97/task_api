const crypto = require('crypto');

exports.seed = async function(knex) {
  await knex('priorities').del()
  await knex('priorities').insert([
    {id: 1, guid: crypto.randomUUID(), description: 'Very low', color: '#A4FFA4'},
    {id: 2, guid: crypto.randomUUID(), description: 'Low', color: '#46FF46'},
    {id: 3, guid: crypto.randomUUID(), description: 'Medium', color: '#FFFF00'},
    {id: 4, guid: crypto.randomUUID(), description: 'High', color: '#FF0000'},
    {id: 5, guid: crypto.randomUUID(), description: 'Very high', color: '#8A0000'},
    {id: 6, guid: crypto.randomUUID(), description: 'Critical', color: '#FF00FF'},
    {id: 7, guid: crypto.randomUUID(), description: 'Immediate', color: '#480000'},
    {id: 8, guid: crypto.randomUUID(), description: 'Urgent', color: '#400080'},
  ]);
};
