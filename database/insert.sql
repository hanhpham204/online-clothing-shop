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