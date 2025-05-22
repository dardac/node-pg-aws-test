"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
const pg_1 = require("pg");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pool = new pg_1.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432', 10),
});
exports.pool = pool;
async function initializeDatabase() {
    try {
        const client = await pool.connect();
        const initScript = fs_1.default.readFileSync(path_1.default.join(__dirname, '../init/01.sql'), 'utf8');
        await client.query(initScript);
        console.log('Database initialized successfully');
        client.release();
    }
    catch (error) {
        console.error('Error initializing database:', error);
    }
}
initializeDatabase();
