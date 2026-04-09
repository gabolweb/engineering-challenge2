const request = require('supertest');
const app = require('../index');

describe('GET /api/items', () => {
  it('returns paginated response with { data, meta } envelope', async () => {
    const res = await request(app).get('/api/items');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('meta');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toMatchObject({
      total: expect.any(Number),
      page: expect.any(Number),
      pageSize: expect.any(Number),
      totalPages: expect.any(Number),
    });
  });

  it('respects page and pageSize params', async () => {
    const res = await request(app).get('/api/items?page=1&pageSize=3');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.pageSize).toBe(3);
  });

  it('returns second page with correct offset', async () => {
    const page1 = await request(app).get('/api/items?page=1&pageSize=2');
    const page2 = await request(app).get('/api/items?page=2&pageSize=2');

    expect(page1.body.data[0].id).not.toBe(page2.body.data[0].id);
    expect(page2.body.meta.page).toBe(2);
  });

  it('returns empty data for page beyond total', async () => {
    const res = await request(app).get('/api/items?page=9999&pageSize=20');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.meta.total).toBeGreaterThan(0);
  });

  it('filters items by search query (q param)', async () => {
    const res = await request(app).get('/api/items?q=Laptop');
    expect(res.status).toBe(200);
    res.body.data.forEach(item => {
      expect(item.name.toLowerCase()).toContain('laptop');
    });
    expect(res.body.meta.total).toBeGreaterThan(0);
  });

  it('returns empty results for non-matching search', async () => {
    const res = await request(app).get('/api/items?q=xyznonexistent999');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.meta.total).toBe(0);
  });

  it('combines search and pagination', async () => {
    const res = await request(app).get('/api/items?q=Laptop&page=1&pageSize=2');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(2);
    expect(res.body.meta.pageSize).toBe(2);
  });

  it('caps pageSize at 200', async () => {
    const res = await request(app).get('/api/items?pageSize=500');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(200);
    expect(res.body.meta.pageSize).toBe(200);
  });
});

describe('GET /api/items/:id', () => {
  it('returns a single item by id', async () => {
    const res = await request(app).get('/api/items/1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', 1);
    expect(res.body).toHaveProperty('name');
    expect(res.body).toHaveProperty('category');
    expect(res.body).toHaveProperty('price');
  });

  it('returns 404 for non-existent id', async () => {
    const res = await request(app).get('/api/items/999999');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/stats', () => {
  it('returns total and averagePrice', async () => {
    const res = await request(app).get('/api/stats');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('averagePrice');
    expect(typeof res.body.total).toBe('number');
    expect(typeof res.body.averagePrice).toBe('number');
    expect(res.body.total).toBeGreaterThan(0);
  });
});
