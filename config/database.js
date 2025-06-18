const knex = require('knex');
const knexConfig = require('../knexfile');

// Obtener la configuración según el entorno
const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

// Crear la instancia de Knex
const db = knex(config);

module.exports = db;
