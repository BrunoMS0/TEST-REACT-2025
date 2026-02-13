require('dotenv').config();
const mysql = require('mysql2/promise');

async function initDatabase() {
    console.log('Connecting to Railway MySQL...');
    
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true
    });

    console.log('Connected! Creating tables...');

    const sql = `
        CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            unit_price DECIMAL(10,2) NOT NULL
        );

        CREATE TABLE IF NOT EXISTS orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_number VARCHAR(50) NOT NULL,
            date DATE NOT NULL,
            status ENUM('Pending','In Progress','Completed') DEFAULT 'Pending',
            final_price DECIMAL(10,2) DEFAULT 0,
            num_products INT DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS order_products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT NOT NULL,
            product_id INT NOT NULL,
            qty INT NOT NULL,
            total_price DECIMAL(10,2) NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id)
        );
    `;

    await connection.query(sql);
    console.log('Tables created!');

    // Check if products exist
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM products');
    if (rows[0].count === 0) {
        console.log('Inserting sample products...');
        await connection.query(`
            INSERT INTO products (name, unit_price) VALUES 
            ('Laptop ThinkPad X1', 1200.00),
            ('Monitor 27-inch 4K', 350.50),
            ('Mechanical Keyboard', 85.00)
        `);
        console.log('Products inserted!');
    } else {
        console.log('Products already exist, skipping...');
    }

    await connection.end();
    console.log('Done! Database initialized successfully.');
}

initDatabase().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
