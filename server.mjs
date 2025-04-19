import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();

// Configure CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// JWT secret key from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Initialize SQLite database
const initializeDb = async () => {
  console.log('Initializing database...');
  try {
    const db = await open({
      filename: './database.sqlite',
      driver: sqlite3.Database
    });
    console.log('Database connection established');

    // Create users table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT
      )
    `);
    console.log('Users table created/verified');

    // Create history table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        text TEXT,
        voice TEXT,
        settings TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);
    console.log('History table created/verified');

    // Create shares table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS shares (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        history_id INTEGER,
        share_id TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (history_id) REFERENCES history (id)
      )
    `);
    console.log('Shares table created/verified');

    // Insert demo user if not exists
    const demoUser = await db.get('SELECT * FROM users WHERE email = ?', ['test@example.com']);
    if (!demoUser) {
      await db.run(
        'INSERT INTO users (email, password) VALUES (?, ?)',
        ['test@example.com', 'password123']
      );
      console.log('Demo user created');
    } else {
      console.log('Demo user already exists');
    }

    return db;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

let db;
(async () => {
  try {
    db = await initializeDb();
    console.log('Database initialization completed');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
})();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('Invalid token:', err.message);
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Login endpoint
app.post('/api/login', async (req, res) => {
  console.log('Login request received');
  console.log('Request body:', req.body);
  
  const { email, password } = req.body;
  console.log('Login attempt for:', email);
  
  try {
    console.log('Querying database for user...');
    const user = await db.get(
      'SELECT * FROM users WHERE email = ? AND password = ?',
      [email, password]
    );
    
    console.log('Database query result:', user);
    
    if (user) {
      console.log('User found, generating token...');
      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET);
      console.log('Token generated successfully');
      console.log('Sending response with token');
      res.json({ 
        token,
        message: 'Login successful' 
      });
    } else {
      console.log('No user found with provided credentials');
      res.status(401).json({ 
        message: 'Invalid email or password' 
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Save history endpoint
app.post('/api/history', authenticateToken, async (req, res) => {
  const { text, voice, settings } = req.body;
  console.log('Saving history for user:', req.user.userId);
  
  try {
    const result = await db.run(
      'INSERT INTO history (user_id, text, voice, settings) VALUES (?, ?, ?, ?)',
      [req.user.userId, text, voice, JSON.stringify(settings)]
    );
    
    console.log('History saved successfully');
    res.json({ 
      id: result.lastID,
      message: 'History saved successfully' 
    });
  } catch (error) {
    console.error('Error saving history:', error);
    res.status(500).json({ message: 'Error saving history' });
  }
});

// Get history endpoint
app.get('/api/history', authenticateToken, async (req, res) => {
  console.log('Fetching history for user:', req.user.userId);
  
  try {
    const history = await db.all(
      'SELECT * FROM history WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.userId]
    );
    
    console.log('History fetched successfully, count:', history.length);
    res.json(history);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ message: 'Error fetching history' });
  }
});

// Delete history item endpoint
app.delete('/api/history/:id', authenticateToken, async (req, res) => {
  console.log('Deleting history item:', req.params.id, 'for user:', req.user.userId);
  
  try {
    await db.run(
      'DELETE FROM history WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );
    
    console.log('History item deleted successfully');
    res.json({ message: 'History item deleted successfully' });
  } catch (error) {
    console.error('Error deleting history item:', error);
    res.status(500).json({ message: 'Error deleting history item' });
  }
});

// Analytics endpoint
app.get('/api/analytics', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get total conversions and characters
    const historyQuery = await db.all(
      'SELECT text, language FROM history WHERE user_id = ?',
      [userId]
    );
    
    const totalConversions = historyQuery.length;
    const totalCharacters = historyQuery.reduce((sum, item) => sum + item.text.length, 0);
    
    // Calculate language statistics
    const languageStats = historyQuery.reduce((stats, item) => {
      stats[item.language] = (stats[item.language] || 0) + 1;
      return stats;
    }, {});
    
    res.json({
      totalConversions,
      totalCharacters,
      languageStats
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Create share endpoint
app.post('/api/share/create/:historyId', authenticateToken, async (req, res) => {
  const { historyId } = req.params;
  console.log('Creating share for history item:', historyId);
  
  try {
    // Verify the history item belongs to the user
    const historyItem = await db.get(
      'SELECT * FROM history WHERE id = ? AND user_id = ?',
      [historyId, req.user.userId]
    );
    
    if (!historyItem) {
      console.log('History item not found or does not belong to user');
      return res.status(404).json({ message: 'History item not found' });
    }

    // Generate a unique share ID
    const shareId = Math.random().toString(36).substring(2, 15);
    
    // Create the share
    await db.run(
      'INSERT INTO shares (history_id, share_id) VALUES (?, ?)',
      [historyId, shareId]
    );
    
    const shareUrl = `${req.protocol}://${req.get('host')}/shared/${shareId}`;
    console.log('Share created successfully:', shareUrl);
    res.json({ shareUrl });
  } catch (error) {
    console.error('Error creating share:', error);
    res.status(500).json({ message: 'Error creating share' });
  }
});

// Get shared history endpoint
app.get('/api/share/:shareId', async (req, res) => {
  const { shareId } = req.params;
  console.log('Fetching shared history for share ID:', shareId);
  
  try {
    const share = await db.get(
      'SELECT h.* FROM history h JOIN shares s ON h.id = s.history_id WHERE s.share_id = ?',
      [shareId]
    );
    
    if (!share) {
      console.log('Shared history not found');
      return res.status(404).json({ message: 'Shared history not found' });
    }
    
    console.log('Shared history fetched successfully');
    res.json(share);
  } catch (error) {
    console.error('Error fetching shared history:', error);
    res.status(500).json({ message: 'Error fetching shared history' });
  }
});

// Add a catch-all route to serve the index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 