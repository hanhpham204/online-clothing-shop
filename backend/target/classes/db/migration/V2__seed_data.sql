-- V2: Seed initial data
-- Default admin user (password: Admin@123)
INSERT INTO users (email, password, full_name, phone, role, is_active)
VALUES ('admin@voguestore.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Admin VogueStore', '0901234567', 'ADMIN', true);

-- Categories
INSERT INTO categories (name, slug, description, is_active) VALUES
('Áo', 'ao', 'Tất cả các loại áo thời trang', true),
('Quần', 'quan', 'Tất cả các loại quần thời trang', true),
('Váy & Đầm', 'vay-dam', 'Váy và đầm nữ thời trang', true),
('Phụ kiện', 'phu-kien', 'Phụ kiện thời trang', true),
('Giày dép', 'giay-dep', 'Giày dép thời trang', true);

-- Sub-categories for "Áo"
INSERT INTO categories (name, slug, description, parent_id, is_active) VALUES
('Áo thun', 'ao-thun', 'Áo thun nam nữ', 1, true),
('Áo sơ mi', 'ao-so-mi', 'Áo sơ mi công sở', 1, true),
('Áo khoác', 'ao-khoac', 'Áo khoác mùa đông', 1, true),
('Áo hoodie', 'ao-hoodie', 'Áo hoodie thời trang', 1, true);

-- Sub-categories for "Quần"
INSERT INTO categories (name, slug, description, parent_id, is_active) VALUES
('Quần jean', 'quan-jean', 'Quần jean nam nữ', 2, true),
('Quần kaki', 'quan-kaki', 'Quần kaki công sở', 2, true),
('Quần short', 'quan-short', 'Quần short mùa hè', 2, true);

-- Sample products
INSERT INTO products (name, slug, description, material, brand, category_id, base_price, sale_price, is_active, is_featured) VALUES
('Áo Thun Cotton Basic', 'ao-thun-cotton-basic', 'Áo thun cotton 100% thoáng mát, phù hợp mọi dịp. Chất liệu cao cấp, form regular fit thoải mái.', 'Cotton 100%', 'VogueStore', 6, 250000, 199000, true, true),
('Áo Sơ Mi Oxford Slim Fit', 'ao-so-mi-oxford-slim-fit', 'Áo sơ mi Oxford cao cấp, form slim fit lịch lãm. Phù hợp đi làm và dự tiệc.', 'Cotton Oxford', 'VogueStore', 7, 450000, 399000, true, true),
('Áo Khoác Bomber Unisex', 'ao-khoac-bomber-unisex', 'Áo khoác bomber phong cách streetwear, chống gió tốt, unisex.', 'Polyester', 'VogueStore', 8, 650000, 549000, true, true),
('Hoodie Oversize Premium', 'hoodie-oversize-premium', 'Hoodie oversize chất nỉ dày, mặc ấm mùa đông. In logo thêu cao cấp.', 'Cotton Fleece', 'VogueStore', 9, 550000, 479000, true, true),
('Quần Jean Slim Fit Xanh Đậm', 'quan-jean-slim-fit-xanh-dam', 'Quần jean slim fit co giãn tốt, màu xanh đậm classic. Wash nhẹ tạo hiệu ứng vintage.', 'Denim Cotton', 'VogueStore', 10, 500000, 429000, true, true),
('Quần Kaki Chinos Regular', 'quan-kaki-chinos-regular', 'Quần kaki chinos regular fit, chất vải mềm mại. Thích hợp đi làm và đi chơi.', 'Cotton Twill', 'VogueStore', 11, 400000, 349000, true, false),
('Quần Short Linen Mùa Hè', 'quan-short-linen-mua-he', 'Quần short linen thoáng mát cho mùa hè. Chất liệu tự nhiên, thân thiện với da.', 'Linen', 'VogueStore', 12, 300000, 249000, true, false),
('Váy Midi Hoa Nhí', 'vay-midi-hoa-nhi', 'Váy midi họa tiết hoa nhí vintage, chất voan nhẹ nhàng thanh lịch.', 'Voan', 'VogueStore', 3, 480000, 399000, true, true);

-- Product variants
INSERT INTO product_variants (product_id, size, color, color_code, sku, stock_quantity) VALUES
-- Áo Thun Cotton Basic
(1, 'S', 'Trắng', '#FFFFFF', 'AT-BASIC-S-WHITE', 50),
(1, 'M', 'Trắng', '#FFFFFF', 'AT-BASIC-M-WHITE', 80),
(1, 'L', 'Trắng', '#FFFFFF', 'AT-BASIC-L-WHITE', 60),
(1, 'XL', 'Trắng', '#FFFFFF', 'AT-BASIC-XL-WHITE', 40),
(1, 'S', 'Đen', '#000000', 'AT-BASIC-S-BLACK', 50),
(1, 'M', 'Đen', '#000000', 'AT-BASIC-M-BLACK', 80),
(1, 'L', 'Đen', '#000000', 'AT-BASIC-L-BLACK', 60),
(1, 'XL', 'Đen', '#000000', 'AT-BASIC-XL-BLACK', 40),
-- Áo Sơ Mi Oxford
(2, 'S', 'Trắng', '#FFFFFF', 'SM-OXF-S-WHITE', 30),
(2, 'M', 'Trắng', '#FFFFFF', 'SM-OXF-M-WHITE', 50),
(2, 'L', 'Trắng', '#FFFFFF', 'SM-OXF-L-WHITE', 40),
(2, 'M', 'Xanh nhạt', '#ADD8E6', 'SM-OXF-M-LBLUE', 50),
(2, 'L', 'Xanh nhạt', '#ADD8E6', 'SM-OXF-L-LBLUE', 40),
-- Áo Khoác Bomber
(3, 'M', 'Đen', '#000000', 'AK-BMB-M-BLACK', 25),
(3, 'L', 'Đen', '#000000', 'AK-BMB-L-BLACK', 30),
(3, 'XL', 'Đen', '#000000', 'AK-BMB-XL-BLACK', 20),
(3, 'M', 'Xanh rêu', '#556B2F', 'AK-BMB-M-GREEN', 25),
(3, 'L', 'Xanh rêu', '#556B2F', 'AK-BMB-L-GREEN', 30),
-- Hoodie Oversize
(4, 'M', 'Đen', '#000000', 'HD-OVS-M-BLACK', 40),
(4, 'L', 'Đen', '#000000', 'HD-OVS-L-BLACK', 50),
(4, 'XL', 'Đen', '#000000', 'HD-OVS-XL-BLACK', 30),
(4, 'M', 'Xám', '#808080', 'HD-OVS-M-GRAY', 40),
(4, 'L', 'Xám', '#808080', 'HD-OVS-L-GRAY', 50),
-- Quần Jean
(5, 'S', 'Xanh đậm', '#191970', 'QJ-SLIM-S-DBLUE', 30),
(5, 'M', 'Xanh đậm', '#191970', 'QJ-SLIM-M-DBLUE', 50),
(5, 'L', 'Xanh đậm', '#191970', 'QJ-SLIM-L-DBLUE', 40),
(5, 'XL', 'Xanh đậm', '#191970', 'QJ-SLIM-XL-DBLUE', 25),
-- Quần Kaki
(6, 'M', 'Be', '#F5F5DC', 'QK-REG-M-BEIGE', 40),
(6, 'L', 'Be', '#F5F5DC', 'QK-REG-L-BEIGE', 50),
(6, 'M', 'Đen', '#000000', 'QK-REG-M-BLACK', 40),
(6, 'L', 'Đen', '#000000', 'QK-REG-L-BLACK', 50),
-- Quần Short
(7, 'M', 'Be', '#F5F5DC', 'QS-LIN-M-BEIGE', 35),
(7, 'L', 'Be', '#F5F5DC', 'QS-LIN-L-BEIGE', 45),
-- Váy Midi
(8, 'S', 'Hồng', '#FFB6C1', 'VM-MID-S-PINK', 25),
(8, 'M', 'Hồng', '#FFB6C1', 'VM-MID-M-PINK', 35),
(8, 'L', 'Hồng', '#FFB6C1', 'VM-MID-L-PINK', 20);

-- Product images (placeholder URLs)
INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary) VALUES
(1, '/images/products/ao-thun-basic-1.jpg', 'Áo thun cotton basic trắng', 0, true),
(1, '/images/products/ao-thun-basic-2.jpg', 'Áo thun cotton basic đen', 1, false),
(2, '/images/products/ao-so-mi-oxford-1.jpg', 'Áo sơ mi Oxford trắng', 0, true),
(3, '/images/products/ao-khoac-bomber-1.jpg', 'Áo khoác bomber đen', 0, true),
(4, '/images/products/hoodie-oversize-1.jpg', 'Hoodie oversize đen', 0, true),
(5, '/images/products/quan-jean-slim-1.jpg', 'Quần jean slim fit', 0, true),
(6, '/images/products/quan-kaki-chinos-1.jpg', 'Quần kaki chinos', 0, true),
(7, '/images/products/quan-short-linen-1.jpg', 'Quần short linen', 0, true),
(8, '/images/products/vay-midi-hoa-1.jpg', 'Váy midi hoa nhí', 0, true);
