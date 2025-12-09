require('dotenv').config();
const { initializeDatabase } = require('../config/database');

async function init() {
    console.log('Initializing database...');
    await initializeDatabase();
    console.log('Database initialization complete!');
}

init().catch(console.error);
