const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const productsRoutes = require('./routes/products');
const ordersRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);

app.get('/', (req, res) => {
    res.send('Orders API is running');
});

app.listen(PORT, () => {
    console.log(`Server is running heavily on http://localhost:${PORT}`);
});
