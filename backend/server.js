/**
 * Restyle Wardrobe Optimizer - Backend Server
 * Cleaned MVP backend for:
 * - Home
 * - Wardrobe
 * - Outfit Generator
 * - Outfit Preview
 * - Login / Signup (frontend only for now)
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const pool = require('./config/database');
const { beamSearchGenerateOutfits } = require('./outfitGenerator');
const {
  callPredictService,
  normalizePredictionPayload,
  buildSuggestedName
} = require('./clothingPrediction');

const app = express();
const PORT = process.env.PORT || 5000;
const uploadsDir = path.join(__dirname, 'public', 'uploads');
const ALLOWED_FORMALITY = new Set(['casual', 'business', 'formal', 'athletic']);
const ALLOWED_SEASON = new Set(['all', 'spring', 'summer', 'fall', 'winter']);

function cleanText(value, fallback = '') {
  const v = String(value ?? '').trim();
  return v || fallback;
}

function normalizeCategory(value) {
  const c = cleanText(value, 'top').toLowerCase();
  return c;
}

function normalizeSeason(value) {
  const s = cleanText(value, 'all').toLowerCase();
  return ALLOWED_SEASON.has(s) ? s : 'all';
}

function normalizeFormality(value) {
  const f = cleanText(value, 'casual').toLowerCase();
  return ALLOWED_FORMALITY.has(f) ? f : 'casual';
}

// Ensure uploads directory exists once on startup
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Temporary auth middleware for development
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Multer config for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Initialize only the tables currently needed
const initializeDatabase = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS clothing_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL,
        color VARCHAR(100) NOT NULL,
        formality VARCHAR(50) DEFAULT 'casual',
        season VARCHAR(50) DEFAULT 'all',
        notes TEXT,
        image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_clothing_items_user_id
      ON clothing_items(user_id);
    `);

    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await pool.query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('Database tables initialized');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

initializeDatabase();

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Restyle backend is running',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: 'Please fill in the blank spaces' });
  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0)
      return res.status(400).json({ message: 'Email already in use' });
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, hashed]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Please fill in the blank spaces' });
  try {
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0)
      return res.status(401).json({ message: 'Invalid email or password' });
    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: 'Invalid email or password' });
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all clothing items
app.get('/api/clothing', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM clothing_items WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching clothing items:', error);
    res.status(500).json({ error: 'Failed to fetch clothing items' });
  }
});

// Get one clothing item
app.get('/api/clothing/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM clothing_items WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching clothing item:', error);
    res.status(500).json({ error: 'Failed to fetch clothing item' });
  }
});

// Add clothing item manually
app.post('/api/clothing', authenticateToken, async (req, res) => {
  const { name, category, color, formality, season, notes } = req.body;

  if (!name || !category || !color) {
    return res.status(400).json({
      error: 'Missing required fields: name, category, color'
    });
  }

  try {
    const normalizedName = cleanText(name, 'Unnamed Item');
    const normalizedCategory = normalizeCategory(category);
    const normalizedColor = cleanText(color).toLowerCase();
    const normalizedFormality = normalizeFormality(formality);
    const normalizedSeason = normalizeSeason(season);

    const result = await pool.query(
      `
      INSERT INTO clothing_items
      (user_id, name, category, color, formality, season, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
      [
        req.user.id,
        normalizedName,
        normalizedCategory,
        normalizedColor,
        normalizedFormality,
        normalizedSeason,
        cleanText(notes) || null
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding clothing item:', error);
    res.status(500).json({ error: 'Failed to add clothing item' });
  }
});

/**
 * Scan an image with the Python PyTorch service and return suggested wardrobe fields.
 * Requires clothing_predict_server.py running (see repo root). Does not save to DB.
 */
app.post('/api/predict-clothing', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        ok: false,
        error: 'NO_FILE',
        message: 'No image file provided'
      });
    }
    // Extra guardrail: multer already restricts image/*, but this keeps responses clearer.
    if (!req.file.mimetype || !req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({
        ok: false,
        error: 'INVALID_FILE_TYPE',
        message: 'Only image files are supported'
      });
    }

    let raw;
    try {
      raw = await callPredictService(req.file.buffer, req.file.originalname, req.file.mimetype);
    } catch (err) {
      console.error('Prediction service error:', err.message || err);
      const isConn =
        /Cannot reach clothing prediction service|ECONNREFUSED|timed out|timeout/i.test(
          String(err.message || err)
        );
      return res.status(isConn ? 503 : 502).json({
        ok: false,
        error: isConn ? 'PREDICT_UNAVAILABLE' : 'PREDICT_FAILED',
        message: err.message || 'Prediction failed',
        hint:
          'Start the Python app from the repo root: pip install -r requirements (if any) then python clothing_predict_server.py'
      });
    }

    const normalized = normalizePredictionPayload(raw);
    const suggestedName = buildSuggestedName(normalized);

    return res.json({
      ok: true,
      suggestedName,
      category: normalized.category,
      color: normalized.color,
      season: normalized.season,
      description: normalized.description,
      confidence: normalized.confidence,
      rawCategory: normalized.rawCategory,
      imagenetTop5: normalized.imagenetTop5,
      raw: raw
    });
  } catch (error) {
    console.error('predict-clothing route error:', error);
    return res.status(500).json({
      ok: false,
      error: 'SERVER_ERROR',
      message: error.message || 'Server error'
    });
  }
});

// Delete clothing item
app.delete('/api/clothing/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM clothing_items WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({
      message: 'Item deleted successfully',
      item: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting clothing item:', error);
    res.status(500).json({ error: 'Failed to delete clothing item' });
  }
});

// Upload clothing image and save item
app.post('/api/upload-clothing', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    if (!req.file.mimetype || !req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'Only image files are allowed' });
    }

    const {
      name,
      category,
      color,
      formality,
      season,
      brand,
      size,
      notes
    } = req.body;

    if (!category || !color) {
      return res.status(400).json({
        error: 'Missing required fields: category, color'
      });
    }

    const normalizedName = cleanText(name || brand, 'Unnamed Item');
    const normalizedCategory = normalizeCategory(category);
    const normalizedColor = cleanText(color).toLowerCase();
    const normalizedFormality = normalizeFormality(formality);
    const normalizedSeason = normalizeSeason(season);
    const filename = `${uuidv4()}-${Date.now()}.jpg`;
    const fullImagePath = path.join(uploadsDir, filename);
    const imageUrl = `/uploads/${filename}`;

    await sharp(req.file.buffer)
      .resize(800, 1000, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toFile(fullImagePath);

    const combinedNotes = [
      brand ? `Brand: ${brand}` : null,
      size ? `Size: ${size}` : null,
      notes || null
    ]
      .filter(Boolean)
      .join(' | ');

    const result = await pool.query(
      `
      INSERT INTO clothing_items
      (user_id, name, category, color, formality, season, notes, image_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
      `,
      [
        req.user.id,
        normalizedName,
        normalizedCategory,
        normalizedColor,
        normalizedFormality,
        normalizedSeason,
        combinedNotes || null,
        imageUrl
      ]
    );

    res.status(201).json({
      success: true,
      clothing_item: result.rows[0],
      imageUrl
    });
  } catch (error) {
    console.error('Error uploading clothing image:', error);
    res.status(500).json({ error: 'Failed to upload clothing image' });
  }
});

// Generate outfits
app.post('/api/outfits/generate', authenticateToken, async (req, res) => {
  try {
    const { formality = 'all', season = 'all', beamWidth = 5 } = req.body;

    const result = await pool.query(
      'SELECT * FROM clothing_items WHERE user_id = $1',
      [req.user.id]
    );

    const items = result.rows;
    const outfits = beamSearchGenerateOutfits(items, {
      formality,
      season,
      beamWidth
    });

    res.json({
      totalItems: items.length,
      totalOutfitsGenerated: outfits.length,
      outfits
    });
  } catch (error) {
    console.error('Error generating outfits:', error);
    res.status(500).json({ error: 'Failed to generate outfits' });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({
    error: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n✓ Restyle Backend running at http://localhost:${PORT}\n`);
});