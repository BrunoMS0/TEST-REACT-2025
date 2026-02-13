CREATE DATABASE IF NOT EXISTS orders_db;
USE orders_db;

CREATE TABLE IF NOT EXISTS products (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  unit_price  DECIMAL(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(50) NOT NULL,
  date        DATE         NOT NULL,
  status      ENUM('Pending','In Progress','Completed') DEFAULT 'Pending',
  final_price DECIMAL(10,2) DEFAULT 0,
  num_products INT          DEFAULT 0
);

CREATE TABLE IF NOT EXISTS order_products (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  order_id    INT NOT NULL,
  product_id  INT NOT NULL,
  qty         INT NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Seed Data (3 products as requested)
INSERT INTO products (name, unit_price) VALUES 
('Laptop ThinkPad X1', 1200.00),
('Monitor 27-inch 4K', 350.50),
('Mechanical Keyboard', 85.00)
ON DUPLICATE KEY UPDATE name=name;
