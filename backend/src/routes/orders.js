const express = require('express');
const router = express.Router();
const pool = require('../db');
const validate = require('../middleware/validate');

// GET /api/orders
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM orders ORDER BY date DESC, id DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/orders/:id
router.get('/:id', async (req, res) => {
    try {
        const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
        if (orders.length === 0) return res.status(404).json({ error: 'Order not found' });

        const [products] = await pool.query(`
      SELECT op.*, p.name, p.unit_price
      FROM order_products op 
      JOIN products p ON op.product_id = p.id 
      WHERE op.order_id = ?
    `, [req.params.id]);

        // Combine
        const order = orders[0];
        order.products = products;

        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Helper to calculate totals
function calculateTotals(products) {
    const num_products = products.length;
    const final_price = products.reduce((sum, p) => sum + (Number(p.total_price) || 0), 0);
    return { num_products, final_price };
}

// Validate products array items
function validateProducts(products) {
    if (!Array.isArray(products)) return 'Products must be an array';
    if (products.length === 0) return 'Order must have at least one product';

    for (let i = 0; i < products.length; i++) {
        const p = products[i];
        if (!p.product_id) return `Product at index ${i}: missing product_id`;
        if (!p.qty || p.qty < 1) return `Product at index ${i}: quantity must be at least 1`;
        if (!Number.isInteger(p.qty)) return `Product at index ${i}: quantity must be a whole number`;
        if (p.total_price == null || p.total_price < 0) return `Product at index ${i}: invalid total_price`;
    }
    return null;
}

// POST /api/orders
router.post('/', validate(['order_number', 'date', 'products']), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { order_number, date, products } = req.body;

        // Validate order_number is not empty
        if (!order_number.trim()) {
            await connection.rollback();
            return res.status(400).json({ error: 'Order number cannot be empty' });
        }

        // Check for duplicate order_number
        const [existing] = await connection.query(
            'SELECT id FROM orders WHERE order_number = ?', [order_number.trim()]
        );
        if (existing.length > 0) {
            await connection.rollback();
            return res.status(400).json({ error: `Order number "${order_number}" already exists` });
        }

        // Validate products array
        const productError = validateProducts(products);
        if (productError) {
            await connection.rollback();
            return res.status(400).json({ error: productError });
        }

        // Verify all product_ids exist and recalculate prices server-side
        for (const p of products) {
            const [found] = await connection.query('SELECT unit_price FROM products WHERE id = ?', [p.product_id]);
            if (found.length === 0) {
                await connection.rollback();
                return res.status(400).json({ error: `Product with id ${p.product_id} does not exist` });
            }
            // Recalculate total_price server-side for security
            p.total_price = Number(found[0].unit_price) * p.qty;
        }

        const { num_products, final_price } = calculateTotals(products);

        // Insert Order
        const [result] = await connection.query(
            'INSERT INTO orders (order_number, date, status, num_products, final_price) VALUES (?, ?, ?, ?, ?)',
            [order_number.trim(), date, 'Pending', num_products, final_price]
        );
        const orderId = result.insertId;

        // Insert Products
        const values = products.map(p => [orderId, p.product_id, p.qty, p.total_price]);
        await connection.query(
            'INSERT INTO order_products (order_id, product_id, qty, total_price) VALUES ?',
            [values]
        );

        await connection.commit();
        res.status(201).json({ id: orderId, message: 'Order created' });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// PUT /api/orders/:id
router.put('/:id', validate(['order_number', 'products']), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const orderId = req.params.id;

        // Check order exists and status
        const [current] = await connection.query('SELECT id, status FROM orders WHERE id = ?', [orderId]);
        if (current.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Order not found' });
        }
        if (current[0].status === 'Completed') {
            await connection.rollback();
            return res.status(400).json({ error: 'Cannot edit completed orders' });
        }

        const { order_number, products } = req.body;

        // Validate order_number is not empty
        if (!order_number.trim()) {
            await connection.rollback();
            return res.status(400).json({ error: 'Order number cannot be empty' });
        }

        // Check for duplicate order_number (exclude current order)
        const [existing] = await connection.query(
            'SELECT id FROM orders WHERE order_number = ? AND id != ?', [order_number.trim(), orderId]
        );
        if (existing.length > 0) {
            await connection.rollback();
            return res.status(400).json({ error: `Order number "${order_number}" already exists` });
        }

        // Validate products array
        const productError = validateProducts(products);
        if (productError) {
            await connection.rollback();
            return res.status(400).json({ error: productError });
        }

        // Verify all product_ids exist and recalculate prices server-side
        for (const p of products) {
            const [found] = await connection.query('SELECT unit_price FROM products WHERE id = ?', [p.product_id]);
            if (found.length === 0) {
                await connection.rollback();
                return res.status(400).json({ error: `Product with id ${p.product_id} does not exist` });
            }
            p.total_price = Number(found[0].unit_price) * p.qty;
        }

        const { num_products, final_price } = calculateTotals(products);

        // Update Order Header
        await connection.query(
            'UPDATE orders SET order_number = ?, num_products = ?, final_price = ? WHERE id = ?',
            [order_number.trim(), num_products, final_price, orderId]
        );

        // Replace Products (Delete all then insert new)
        await connection.query('DELETE FROM order_products WHERE order_id = ?', [orderId]);

        const values = products.map(p => [orderId, p.product_id, p.qty, p.total_price]);
        await connection.query(
            'INSERT INTO order_products (order_id, product_id, qty, total_price) VALUES ?',
            [values]
        );

        await connection.commit();
        res.json({ id: orderId, message: 'Order updated' });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// DELETE /api/orders/:id
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM orders WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Order not found' });
        res.json({ message: 'Order deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/orders/:id/status
router.patch('/:id/status', validate(['status']), async (req, res) => {
    try {
        const { status } = req.body;
        const allowed = ['Pending', 'In Progress', 'Completed'];
        if (!allowed.includes(status)) {
            return res.status(400).json({ error: `Invalid status. Allowed: ${allowed.join(', ')}` });
        }

        const [result] = await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Order not found' });
        res.json({ message: 'Status updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
