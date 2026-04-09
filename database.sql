CREATE DATABASE IF NOT EXISTS fashion_store;
USE fashion_store;

-- 1. Bảng Roles (Phân quyền)
CREATE TABLE roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(255) NOT NULL
);

-- 2. Bảng Categories (Danh mục - Có tự trỏ)
CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT NULL,
    category_name VARCHAR(255) NOT NULL,
    description TEXT,
    FOREIGN KEY (parent_id) REFERENCES categories(category_id) ON DELETE SET NULL
);

-- 3. Bảng Brands (Thương hiệu)
CREATE TABLE brands (
    brand_id INT AUTO_INCREMENT PRIMARY KEY,
    brand_name VARCHAR(100) NOT NULL,
    logo_url VARCHAR(500)
);

-- 4. Bảng Users (Người dùng)
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

-- 5. Bảng Addresses (Địa chỉ giao hàng)
CREATE TABLE addresses (
    address_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    city_name VARCHAR(255),
    district_name VARCHAR(255),
    street_name VARCHAR(255),
    is_default BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 6. Bảng Products (Sản phẩm chung)
CREATE TABLE products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT,
    brand_id INT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    material VARCHAR(255),
    gender VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(category_id),
    FOREIGN KEY (brand_id) REFERENCES brands(brand_id)
);

-- 7. Bảng Product_Variants (Biến thể: Màu sắc, Kích cỡ)
CREATE TABLE product_variants (
    variant_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    sku VARCHAR(100) UNIQUE NOT NULL,
    color VARCHAR(50) NOT NULL,
    size VARCHAR(20) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    image_url VARCHAR(500),
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- 8. Bảng Product_Images (Ảnh phụ của sản phẩm)
CREATE TABLE product_images (
    image_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    image_url VARCHAR(500) NOT NULL,
    display_order INT DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- 9. Bảng Carts (Giỏ hàng)
CREATE TABLE carts (
    cart_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 10. Bảng Cart_Items (Chi tiết giỏ hàng)
CREATE TABLE cart_items (
    cart_item_id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id INT,
    variant_id INT,
    quantity INT DEFAULT 1,
    FOREIGN KEY (cart_id) REFERENCES carts(cart_id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id)
);

-- 11. Bảng Orders (Đơn hàng)
CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    address_id INT,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'Unpaid',
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (address_id) REFERENCES addresses(address_id)
);

-- 12. Bảng Order_Details (Chi tiết đơn hàng)
CREATE TABLE order_details (
    od_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    variant_id INT,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id)
);

-- 13. Bảng Comments (Đánh giá)
CREATE TABLE comments (
    comment_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    user_id INT,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
-- Thêm Roles
INSERT INTO roles (role_name) VALUES ('ADMIN'), ('CUSTOMER');

-- Thêm Categories (Mô phỏng cấu trúc cây)
INSERT INTO categories (parent_id, category_name, description) VALUES 
(NULL, 'Thời trang Nam', 'Các sản phẩm dành cho nam giới'),   -- ID 1
(NULL, 'Thời trang Nữ', 'Các sản phẩm dành cho nữ giới'),     -- ID 2
(1, 'Áo thun Nam', 'Áo thun cộc tay, dài tay nam'),           -- ID 3 (Con của ID 1)
(1, 'Quần Jean Nam', 'Quần jean form rộng, skinny'),          -- ID 4 (Con của ID 1)
(2, 'Váy Nữ', 'Váy công sở, váy dạo phố');                    -- ID 5 (Con của ID 2)

-- Thêm Brands
INSERT INTO brands (brand_name, logo_url) VALUES 
('Coolmate', 'https://example.com/logo-coolmate.png'),
('Zara', 'https://example.com/logo-zara.png');

-- Thêm Users (Mật khẩu nên được băm bằng BCrypt trong thực tế)
INSERT INTO users (role_id, email, password, name) VALUES 
(1, 'admin@store.com', 'hashed_pw_123', 'Quản trị viên'),
(2, 'khachhang@gmail.com', 'hashed_pw_456', 'Nguyễn Văn A');

-- Thêm Address cho khách hàng
INSERT INTO addresses (user_id, city_name, district_name, street_name, is_default) VALUES 
(2, 'Hồ Chí Minh', 'Gò Vấp', '123 Nguyễn Thái Sơn', TRUE);

-- Thêm Products
INSERT INTO products (category_id, brand_id, name, description, material, gender) VALUES 
(3, 1, 'Áo thun nam Basic Cotton', 'Áo thun trơn thoáng mát', '100% Cotton', 'Men'), -- ID 1
(4, 2, 'Quần Jean ống suông', 'Quần jean rách gối phong cách bụi bặm', 'Denim', 'Men'); -- ID 2

-- Thêm Product Variants (Các phiên bản màu và size của Áo thun ID 1)
INSERT INTO product_variants (product_id, sku, color, size, price, stock_quantity, image_url) VALUES 
(1, 'TSHIRT-BLK-M', 'Đen', 'M', 150000.00, 50, 'https://example.com/ao-den-m.jpg'),
(1, 'TSHIRT-BLK-L', 'Đen', 'L', 150000.00, 30, 'https://example.com/ao-den-l.jpg'),
(1, 'TSHIRT-WHT-M', 'Trắng', 'M', 150000.00, 20, 'https://example.com/ao-trang-m.jpg'),
(2, 'JEAN-BLU-30', 'Xanh nhạt', '30', 350000.00, 15, 'https://example.com/jean-xanh-30.jpg');

-- Thêm Cart & Cart Items
INSERT INTO carts (user_id) VALUES (2);
INSERT INTO cart_items (cart_id, variant_id, quantity) VALUES 
(1, 1, 2), -- Mua 2 áo thun đen size M
(1, 4, 1); -- Mua 1 quần jean size 30

-- Thêm Đơn hàng (Khách hàng checkout giỏ hàng trên)
INSERT INTO orders (user_id, address_id, total_amount, status, payment_method, payment_status) VALUES 
(2, 1, 650000.00, 'Pending', 'COD', 'Unpaid');

-- Thêm Chi tiết đơn hàng
INSERT INTO order_details (order_id, variant_id, quantity, unit_price) VALUES 
(1, 1, 2, 150000.00),
(1, 4, 1, 350000.00);