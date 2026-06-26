const crypto = require('crypto');

exports.seed = async function(knex) {
  await knex('statuses').del()
  await knex('statuses').insert([
    {id: 1, guid: crypto.randomUUID(), description: 'Created', color: '#FFFF80'},
    {id: 2, guid: crypto.randomUUID(), description: 'Assigned', color: '#0080FF'},
    {id: 3, guid: crypto.randomUUID(), description: 'In Progress', color: '#FFAD5B'},
    {id: 4, guid: crypto.randomUUID(), description: 'Completed', color: '#77FF77'},
  ]);
};
