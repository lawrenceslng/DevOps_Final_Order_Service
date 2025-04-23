// server.js
const express = require('express');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(cors());

// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'orderdb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// POST /order – Create a new order
app.post('/order', async (req, res) => {
  const { user_email, total_price } = req.body;

  if (!user_email || total_price == null) {
    return res.status(400).json({ error: 'Missing user_email or total_price' });
  }

  const order_number = 'ORD-' + uuidv4().split('-')[0]; // Simplified

  try {
    const [result] = await pool.query(
      'INSERT INTO orders (order_number, user_email, total_price) VALUES (?, ?, ?)',
      [order_number, user_email, total_price]
    );
    res.status(201).json({ message: 'Order created', orderId: result.insertId, order_number });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT /order/:id – Update order status
app.put('/order/:id', async (req, res) => {
  const { id } = req.params;
  const { new_status } = req.body;

  const validTransitions = {
    placed: 'shipped',
    shipped: 'delivered',
  };

  if (!new_status || !['shipped', 'delivered'].includes(new_status)) {
    return res.status(400).json({ error: 'Invalid or missing new_status' });
  }

  try {
    const [existing] = await pool.query('SELECT status FROM orders WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Order not found' });

    const currentStatus = existing[0].status;
    if (validTransitions[currentStatus] !== new_status) {
      return res.status(400).json({ error: `Invalid status transition from ${currentStatus} to ${new_status}` });
    }

    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [new_status, id]);
    res.json({ message: 'Order status updated' });
  } catch (err) {
    console.error('Error updating order:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /order – Get all orders for a user
app.get('/order', async (req, res) => {
  console.log('Order Service - GET /order request received:', {
    query: req.query,
    headers: req.headers
  });

  const { email } = req.query;

  if (!email) {
    console.log('Order Service - Missing email in request');
    return res.status(400).json({ error: 'Missing user email in query' });
  }

  try {
    console.log('Order Service - Executing query for email:', email);
    const [orders] = await pool.query('SELECT * FROM orders WHERE user_email = ?', [email]);
    console.log('Order Service - Query result:', orders);

    // Convert total_price from string to number for each order
    const formattedOrders = orders.map(order => ({
      ...order,
      total_price: parseFloat(order.total_price)
    }));

    console.log('Order Service - Formatted orders:', formattedOrders);

    if (!formattedOrders.length) {
      console.log('Order Service - No orders found for email:', email);
    } else {
      console.log('Order Service - Found', formattedOrders.length, 'orders for email:', email);
    }

    res.json(formattedOrders);
  } catch (err) {
    console.error('Order Service - Error fetching orders:', {
      error: err.message,
      stack: err.stack,
      query: 'SELECT * FROM orders WHERE user_email = ?',
      params: [email]
    });
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /order/:id – Get single order details
app.get('/order/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) return res.status(404).json({ error: 'Order not found' });

    res.json(orders[0]);
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ✅ GET /order/health – Health Check
app.get('/order/health', async (req, res) => {
    res.status(200).json({ message: 'Order Service is healthy' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Order Service running on port ${PORT}`);
});
