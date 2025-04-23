-- init.sql

CREATE DATABASE IF NOT EXISTS orderdb;
USE orderdb;
DROP TABLE IF EXISTS orders;

CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  user_email VARCHAR(255) NOT NULL,
  status ENUM('placed', 'shipped', 'delivered') DEFAULT 'placed',
  total_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sample seed data
INSERT INTO orders (order_number, user_email, status, total_price) VALUES
('ORD-10001', 'alice@example.com', 'placed', 59.99),
('ORD-10002', 'bob@example.com', 'shipped', 129.50),
('ORD-10003', 'charlie@example.com', 'delivered', 249.00),
('ORD-10004', 'alice@example.com', 'delivered', 19.99),
('ORD-10005', 'david@example.com', 'placed', 75.00);
