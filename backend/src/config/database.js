const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || './database/dairy.db';
const absoluteDbPath = path.resolve(__dirname, '../../', dbPath);

// Ensure database directory exists
const dbDir = path.dirname(absoluteDbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

let dbInstance = null;
let SQL = null;
let isInitialized = false;

// Synchronous wrapper for sql.js
class SyncDB {
    constructor(database) {
        this.database = database;
    }

    prepare(sql) {
        const self = this;
        return {
            run(...params) {
                try {
                    self.database.run(sql, params);
                    return { 
                        lastInsertRowid: self.database.exec("SELECT last_insert_rowid()")[0]?.values[0]?.[0] || 0,
                        changes: self.database.getRowsModified()
                    };
                } catch (e) {
                    console.error('SQL Error:', e.message, sql);
                    throw e;
                }
            },
            get(...params) {
                try {
                    const stmt = self.database.prepare(sql);
                    stmt.bind(params);
                    if (stmt.step()) {
                        const row = stmt.getAsObject();
                        stmt.free();
                        return row;
                    }
                    stmt.free();
                    return undefined;
                } catch (e) {
                    console.error('SQL Error:', e.message, sql);
                    throw e;
                }
            },
            all(...params) {
                try {
                    const stmt = self.database.prepare(sql);
                    stmt.bind(params);
                    const results = [];
                    while (stmt.step()) {
                        results.push(stmt.getAsObject());
                    }
                    stmt.free();
                    return results;
                } catch (e) {
                    console.error('SQL Error:', e.message, sql);
                    throw e;
                }
            }
        };
    }

    exec(sql) {
        this.database.run(sql);
    }

    pragma(statement) {
        this.database.run(`PRAGMA ${statement}`);
    }

    transaction(fn) {
        return () => {
            this.database.run('BEGIN TRANSACTION');
            try {
                fn();
                this.database.run('COMMIT');
            } catch (e) {
                this.database.run('ROLLBACK');
                throw e;
            }
        };
    }

    save() {
        const data = this.database.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(absoluteDbPath, buffer);
    }
}

// Get database instance (throws if not initialized)
function getDb() {
    if (!dbInstance) {
        throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return dbInstance;
}

// Initialize database
async function initDatabase() {
    if (dbInstance) return dbInstance;

    SQL = await initSqlJs();

    // Load existing database or create new
    if (fs.existsSync(absoluteDbPath)) {
        const fileBuffer = fs.readFileSync(absoluteDbPath);
        dbInstance = new SyncDB(new SQL.Database(fileBuffer));
    } else {
        dbInstance = new SyncDB(new SQL.Database());
    }

    // Enable foreign keys
    dbInstance.pragma('foreign_keys = ON');
    isInitialized = true;

    return dbInstance;
}

// Initialize database with schema
async function initializeDatabase() {
    await initDatabase();

    const schemaPath = path.resolve(__dirname, '../../database/init.sql');

    if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        // Execute each statement separately
        const statements = schema.split(';').filter(s => s.trim());
        for (const stmt of statements) {
            if (stmt.trim()) {
                try {
                    dbInstance.database.run(stmt);
                } catch (e) {
                    // Ignore "table already exists" errors
                    if (!e.message.includes('already exists')) {
                        console.error('Schema error:', e.message);
                    }
                }
            }
        }
        dbInstance.save();
        console.log('Database initialized successfully');
    } else {
        console.error('Schema file not found:', schemaPath);
    }
}

// Auto-save on changes (called periodically)
function saveDatabase() {
    if (dbInstance) {
        dbInstance.save();
    }
}

// Save every 30 seconds
setInterval(saveDatabase, 30000);

// Save on exit
process.on('exit', saveDatabase);
process.on('SIGINT', () => { saveDatabase(); process.exit(); });
process.on('SIGTERM', () => { saveDatabase(); process.exit(); });

// Export a proxy object that always gets the current db instance
const db = new Proxy({}, {
    get(target, prop) {
        const instance = getDb();
        if (typeof instance[prop] === 'function') {
            return instance[prop].bind(instance);
        }
        return instance[prop];
    }
});

module.exports = { 
    db,
    initDatabase, 
    initializeDatabase,
    saveDatabase
};
