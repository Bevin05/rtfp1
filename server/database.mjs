import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize database
export const db = await open({
  filename: path.join(__dirname, 'database.sqlite'),
  driver: sqlite3.Database
});

// Create tables if they don't exist
await db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    voice TEXT NOT NULL,
    settings TEXT NOT NULL,
    share_id TEXT UNIQUE,
    favorite BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  -- Add index for share_id for faster lookups
  CREATE INDEX IF NOT EXISTS idx_history_share_id ON history(share_id);
  
  -- Add index for user_id for faster history lookups
  CREATE INDEX IF NOT EXISTS idx_history_user_id ON history(user_id);
`); 