const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const router = express.Router();
const DATA_PATH = path.join(__dirname, '../../../data/items.json');

async function readData() {
  const raw = await fs.readFile(DATA_PATH, 'utf-8');
  return JSON.parse(raw);
}

// GET /api/items
router.get('/', async (req, res, next) => {
  try {
    const data = await readData();
    const { q, page = 1, pageSize = 20 } = req.query;
    let results = data;

    if (q) {
      results = results.filter(item =>
        item.name.toLowerCase().includes(q.toLowerCase())
      );
    }

    const total = results.length;
    const pageNum = Math.max(1, parseInt(page));
    const size = Math.max(1, Math.min(200, parseInt(pageSize)));
    const offset = (pageNum - 1) * size;
    const paged = results.slice(offset, offset + size);

    res.json({
      data: paged,
      meta: {
        total,
        page: pageNum,
        pageSize: size,
        totalPages: Math.ceil(total / size),
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/items/:id
router.get('/:id', async (req, res, next) => {
  try {
    const data = await readData();
    const item = data.find(i => i.id === parseInt(req.params.id));
    if (!item) {
      const err = new Error('Item not found');
      err.status = 404;
      throw err;
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// POST /api/items
router.post('/', async (req, res, next) => {
  try {
    const { name, category, price } = req.body;

    if (!name || !category || price == null) {
      return res.status(400).json({ error: 'name, category, and price are required' });
    }

    const data = await readData();
    const item = { id: Date.now(), name, category, price: Number(price) };
    data.push(item);
    await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));

    const { invalidateCache } = require('./stats');
    invalidateCache();

    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

module.exports = router;