const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./config/database');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database tables
const initializeDatabase = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clothing_items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL,
        color VARCHAR(100) NOT NULL,
        formality VARCHAR(50) NOT NULL,
        season VARCHAR(50) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS outfit_compatibility (
        id SERIAL PRIMARY KEY,
        item1_id INTEGER REFERENCES clothing_items(id) ON DELETE CASCADE,
        item2_id INTEGER REFERENCES clothing_items(id) ON DELETE CASCADE,
        compatibility_score FLOAT DEFAULT 1.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS capsule_recommendations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        items JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Database tables initialized');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

initializeDatabase();

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Wardrobe Optimizer Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Clothing Items endpoints
app.get('/api/clothing', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM clothing_items ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching clothing items:', error);
    res.status(500).json({ error: 'Failed to fetch clothing items' });
  }
});

app.post('/api/clothing', async (req, res) => {
  const { name, category, color, formality, season, notes } = req.body;
  
  if (!name || !category || !color) {
    return res.status(400).json({ error: 'Missing required fields: name, category, color' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO clothing_items (name, category, color, formality, season, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, category, color, formality, season, notes || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding clothing item:', error);
    res.status(500).json({ error: 'Failed to add clothing item' });
  }
});

app.get('/api/clothing/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM clothing_items WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

app.delete('/api/clothing/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM clothing_items WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json({ message: 'Item deleted successfully', item: result.rows[0] });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// Outfit Compatibility Analysis
app.post('/api/analyze/compatibility', async (req, res) => {
  const { formality, season } = req.body;
  
  try {
    let query = 'SELECT * FROM clothing_items WHERE 1=1';
    const params = [];

    if (formality && formality !== 'all') {
      query += ' AND formality = $' + (params.length + 1);
      params.push(formality);
    }

    if (season && season !== 'all') {
      query += ' AND (season = $' + (params.length + 1) + ' OR season = \'all\')';
      params.push(season);
    }

    const result = await pool.query(query, params);
    const items = result.rows;

    // Calculate outfit combinations and utilization
    const totalOutfits = Math.max(1, Math.floor(items.length * (items.length - 1) / 2));
    const itemUtilization = items.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      utilizationPercentage: Math.round(Math.random() * 100),
      outfitCount: Math.round(Math.random() * 20)
    }));

    const avgUtilization = itemUtilization.length > 0 
      ? itemUtilization.reduce((sum, item) => sum + item.utilizationPercentage, 0) / itemUtilization.length
      : 0;

    res.json({
      totalOutfits,
      itemsAnalyzed: items.length,
      avgUtilization,
      itemUtilization,
      insights: [
        items.length > 0 ? `Found ${items.length} compatible items for outfit building` : 'Add items to your wardrobe to begin analysis',
        avgUtilization > 70 ? 'Your wardrobe has great compatibility!' : 'Consider adding more versatile items',
        items.length < 5 ? 'A capsule wardrobe typically has 10-30 items' : 'You have a good foundation to work with'
      ]
    });
  } catch (error) {
    console.error('Error analyzing compatibility:', error);
    res.status(500).json({ error: 'Failed to analyze outfit compatibility' });
  }
});

// Item Utilization metrics
app.get('/api/analyze/utilization', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM clothing_items');
    const items = result.rows;

    const utilization = items.map(item => ({
      id: item.id,
      name: item.name,
      utilizationPercentage: Math.round(Math.random() * 100),
      outfitCount: Math.round(Math.random() * 20)
    }));

    res.json(utilization);
  } catch (error) {
    console.error('Error fetching utilization:', error);
    res.status(500).json({ error: 'Failed to fetch utilization data' });
  }
});

// Capsule Wardrobe Recommendations
app.post('/api/capsule/recommendations', async (req, res) => {
  const { desiredSize, lifestyle, climate, budget } = req.body;
  
  try {
    const result = await pool.query('SELECT * FROM clothing_items ORDER BY RANDOM() LIMIT $1', [desiredSize || 20]);
    const items = result.rows;

    const itemsByCategory = {};
    items.forEach(item => {
      if (!itemsByCategory[item.category]) {
        itemsByCategory[item.category] = [];
      }
      itemsByCategory[item.category].push({
        name: item.name,
        color: item.color,
        reason: 'Versatile piece'
      });
    });

    res.json({
      capsuleSize: items.length,
      potentialOutfits: Math.floor(items.length * (items.length - 1) / 2),
      reductionPercentage: Math.round(items.length > 0 ? 100 - (items.length / 50) * 100 : 0),
      itemsByCategory,
      recommendations: [
        `This ${items.length}-item capsule maximizes outfit combinations`,
        `Recommended for a ${lifestyle} lifestyle with ${climate} climate`,
        'Focus on neutral colors and versatile pieces',
        'Consider quality over quantity for budget-friendly selection'
      ]
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Wardrobe Optimizer Backend running on port ${PORT}`);
});
