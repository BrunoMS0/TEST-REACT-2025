const express = require('express');
const router = express.Router();
const pool = require('../db');
const validate = require('../middleware/validate');

// GET /api/products
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM products');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/products
router.post('/', validate(['name', 'unit_price']), async (req, res) => {
    try {
        const { name, unit_price } = req.body;
        const [result] = await pool.query('INSERT INTO products (name, unit_price) VALUES (?, ?)', [name, unit_price]);
        res.status(201).json({ id: result.insertId, name, unit_price });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/products/:id
router.put('/:id', validate(['name', 'unit_price']), async (req, res) => {
    try {
        const { name, unit_price } = req.body;
        const [result] = await pool.query('UPDATE products SET name = ?, unit_price = ? WHERE id = ?', [name, unit_price, req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found' });
        res.json({ id: req.params.id, name, unit_price });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/products/:id
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found' });
        res.json({ message: 'Product deleted' });
    } catch (err) {
        // Check for foreign key constraint (if product is used in orders)
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ error: 'Cannot delete product because it is used in orders.' });
        }
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
