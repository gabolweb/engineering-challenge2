const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const { mean } = require('../utils/stats');

const router = express.Router();
const DATA_PATH = path.join(__dirname, '../../../data/items.json');

let cachedStats = null;

function invalidateCache() {
  cachedStats = null;
}

async function computeStats() {
  const raw = await fs.readFile(DATA_PATH, 'utf-8');
  const items = JSON.parse(raw);
  cachedStats = {
    total: items.length,
    averagePrice: items.length > 0 ? mean(items.map(i => i.price)) : 0,
  };
  return cachedStats;
}

// Eager-load on startup
computeStats().catch(console.error);

// GET /api/stats
router.get('/', async (req, res, next) => {
  try {
    const stats = cachedStats || await computeStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

module.exports = { router, invalidateCache };
