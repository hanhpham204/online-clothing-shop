-- =====================================================================
-- File: insert_products.sql
-- Purpose: Seed 51 sản phẩm (kèm ảnh thật từ Cloudinary) vào database
--          fashion_store. Dữ liệu nguồn: product_image_links_for_sql_agent.json
-- Schema target: database/init.sql (products, product_variants,
--                product_images, categories, brands)
--
-- Cách dùng:
--   1) Database đã được khởi tạo từ init.sql (tables đã tồn tại).
--   2) Chạy file này để nạp categories + 1 brand mặc định + 51 sản phẩm
--      + 51 variants mặc định + 54 ảnh.
--   3) File này TRUNCATE các bảng liên quan tới sản phẩm trước khi seed
--      để tránh dữ liệu trùng. KHÔNG xoá users / orders / carts.
-- =====================================================================

USE fashion_store;

-- ---------------------------------------------------------------------
-- 1) Reset các bảng product-related để re-seed sạch
-- ---------------------------------------------------------------------
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE product_images;
TRUNCATE TABLE product_variants;
TRUNCATE TABLE products;
TRUNCATE TABLE categories;
TRUNCATE TABLE brands;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- 2) Categories: dựng cây 2 cấp khớp với category + subCategory trong JSON
--    Cấp 1: Men / Women / Kids
--    Cấp 2: Topwear / Bottomwear / Winterwear (gắn vào từng cấp 1)
-- ---------------------------------------------------------------------
INSERT INTO categories (category_id, parent_id, category_name, description) VALUES
(1,  NULL, 'Men',                'Men fashion'),
(2,  NULL, 'Women',              'Women fashion'),
(3,  NULL, 'Kids',               'Kids fashion'),
(4,  1,    'Men - Topwear',      'Men top wear (t-shirts, shirts)'),
(5,  1,    'Men - Bottomwear',   'Men bottom wear (trousers, jeans)'),
(6,  1,    'Men - Winterwear',   'Men winter wear (jackets)'),
(7,  2,    'Women - Topwear',    'Women top wear (tops, blouses)'),
(8,  2,    'Women - Bottomwear', 'Women bottom wear (palazzo, pants)'),
(9,  2,    'Women - Winterwear', 'Women winter wear (jackets)'),
(10, 3,    'Kids - Topwear',     'Kids top wear (t-shirts, tops)'),
(11, 3,    'Kids - Bottomwear',  'Kids bottom wear (trousers)');

-- ---------------------------------------------------------------------
-- 3) Brand: JSON không có brand → tạo 1 brand mặc định
-- ---------------------------------------------------------------------
INSERT INTO brands (brand_id, brand_name, logo_url) VALUES
(1, 'Fashion Store', NULL);

-- ---------------------------------------------------------------------
-- 4) Products: 51 sản phẩm. product_id ở DB = product_index trong JSON
--    để dễ trace ngược về file gốc.
-- ---------------------------------------------------------------------
INSERT INTO products (product_id, category_id, brand_id, name, description, material, gender) VALUES
(1,  4,  1, 'Men Round Neck Pure Cotton T-shirt',     'Comfortable men round neck pure cotton t-shirt for everyday wear.', '100% Cotton',     'Men'),
(2,  10, 1, 'Girls Round Neck Cotton Top',            'Soft cotton round neck top for girls.',                              '100% Cotton',     'Kids'),
(3,  4,  1, 'Men Round Neck Pure Cotton T-shirt',     'Premium men round neck pure cotton t-shirt.',                        '100% Cotton',     'Men'),
(4,  10, 1, 'Boy Round Neck Pure Cotton T-shirt',     'Casual boy round neck cotton t-shirt.',                              '100% Cotton',     'Kids'),
(5,  9,  1, 'Women Zip-Front Relaxed Fit Jacket',     'Stylish women zip-front relaxed fit jacket.',                        'Polyester',       'Women'),
(6,  9,  1, 'Women Zip-Front Relaxed Fit Jacket',     'Trendy women zip-front relaxed fit jacket.',                         'Polyester',       'Women'),
(7,  6,  1, 'Men Slim Fit Relaxed Denim Jacket',      'Modern men slim fit relaxed denim jacket.',                          'Denim',           'Men'),
(8,  7,  1, 'Women Round Neck Cotton Top',            'Elegant women round neck cotton top.',                               '100% Cotton',     'Women'),
(9,  4,  1, 'Men Printed Plain Cotton Shirt',         'Smart men printed plain cotton shirt.',                              '100% Cotton',     'Men'),
(10, 4,  1, 'Men Round Neck Pure Cotton T-shirt',     'Daily wear men round neck pure cotton t-shirt.',                     '100% Cotton',     'Men'),
(11, 10, 1, 'Boy Round Neck Pure Cotton T-shirt',     'Playful boy round neck pure cotton t-shirt.',                        '100% Cotton',     'Kids'),
(12, 9,  1, 'Women Zip-Front Relaxed Fit Jacket',     'Soft women zip-front relaxed fit jacket.',                           'Polyester',       'Women'),
(13, 8,  1, 'Women Palazzo Pants with Waist Belt',    'Flowy women palazzo pants with waist belt.',                         'Rayon',           'Women'),
(14, 11, 1, 'Kid Tapered Slim Fit Trouser',           'Comfy kid tapered slim fit trouser.',                                'Cotton Blend',    'Kids'),
(15, 10, 1, 'Girls Round Neck Cotton Top',            'Pretty girls round neck cotton top.',                                '100% Cotton',     'Kids'),
(16, 10, 1, 'Girls Round Neck Cotton Top',            'Light girls round neck cotton top.',                                 '100% Cotton',     'Kids'),
(17, 10, 1, 'Girls Round Neck Cotton Top',            'Smooth girls round neck cotton top.',                                '100% Cotton',     'Kids'),
(18, 10, 1, 'Boy Round Neck Pure Cotton T-shirt',     'Sporty boy round neck cotton t-shirt.',                              '100% Cotton',     'Kids'),
(19, 8,  1, 'Women Palazzo Pants with Waist Belt',    'Stylish women palazzo pants with waist belt.',                       'Rayon',           'Women'),
(20, 10, 1, 'Boy Round Neck Pure Cotton T-shirt',     'Cool boy round neck pure cotton t-shirt.',                           '100% Cotton',     'Kids'),
(21, 10, 1, 'Girls Round Neck Cotton Top',            'Lovely girls round neck cotton top.',                                '100% Cotton',     'Kids'),
(22, 9,  1, 'Women Zip-Front Relaxed Fit Jacket',     'Cozy women zip-front relaxed fit jacket.',                           'Polyester',       'Women'),
(23, 4,  1, 'Men Round Neck Pure Cotton T-shirt',     'Soft men round neck pure cotton t-shirt.',                           '100% Cotton',     'Men'),
(24, 11, 1, 'Kid Tapered Slim Fit Trouser',           'Active kid tapered slim fit trouser.',                               'Cotton Blend',    'Kids'),
(25, 6,  1, 'Men Slim Fit Relaxed Denim Jacket',      'Rugged men slim fit relaxed denim jacket.',                          'Denim',           'Men'),
(26, 4,  1, 'Men Round Neck Pure Cotton T-shirt',     'Breathable men round neck pure cotton t-shirt.',                     '100% Cotton',     'Men'),
(27, 5,  1, 'Men Tapered Fit Flat-Front Trousers',    'Smart men tapered fit flat-front trousers.',                         'Polyester Blend', 'Men'),
(28, 9,  1, 'Women Zip-Front Relaxed Fit Jacket',     'Chic women zip-front relaxed fit jacket.',                           'Polyester',       'Women'),
(29, 6,  1, 'Men Slim Fit Relaxed Denim Jacket',      'Classic men slim fit relaxed denim jacket.',                         'Denim',           'Men'),
(30, 7,  1, 'Women Round Neck Cotton Top',            'Casual women round neck cotton top.',                                '100% Cotton',     'Women'),
(31, 4,  1, 'Men Round Neck Pure Cotton T-shirt',     'Versatile men round neck pure cotton t-shirt.',                      '100% Cotton',     'Men'),
(32, 5,  1, 'Men Tapered Fit Flat-Front Trousers',    'Formal men tapered fit flat-front trousers.',                        'Polyester Blend', 'Men'),
(33, 7,  1, 'Women Round Neck Cotton Top',            'Modern women round neck cotton top.',                                '100% Cotton',     'Women'),
(34, 10, 1, 'Boy Round Neck Pure Cotton T-shirt',     'Soft boy round neck pure cotton t-shirt.',                           '100% Cotton',     'Kids'),
(35, 10, 1, 'Boy Round Neck Pure Cotton T-shirt',     'Light boy round neck pure cotton t-shirt.',                          '100% Cotton',     'Kids'),
(36, 10, 1, 'Girls Round Neck Cotton Top',            'Cute girls round neck cotton top.',                                  '100% Cotton',     'Kids'),
(37, 10, 1, 'Girls Round Neck Cotton Top',            'Comfy girls round neck cotton top.',                                 '100% Cotton',     'Kids'),
(38, 6,  1, 'Men Slim Fit Relaxed Denim Jacket',      'Urban men slim fit relaxed denim jacket.',                           'Denim',           'Men'),
(39, 11, 1, 'Kid Tapered Slim Fit Trouser',           'Daily kid tapered slim fit trouser.',                                'Cotton Blend',    'Kids'),
(40, 6,  1, 'Men Slim Fit Relaxed Denim Jacket',      'Premium men slim fit relaxed denim jacket.',                         'Denim',           'Men'),
(41, 4,  1, 'Men Round Neck Pure Cotton T-shirt',     'Soft touch men round neck pure cotton t-shirt.',                     '100% Cotton',     'Men'),
(42, 7,  1, 'Women Round Neck Cotton Top',            'Lightweight women round neck cotton top.',                           '100% Cotton',     'Women'),
(43, 5,  1, 'Men Tapered Fit Flat-Front Trousers',    'Office men tapered fit flat-front trousers.',                        'Polyester Blend', 'Men'),
(44, 4,  1, 'Men Round Neck Pure Cotton T-shirt',     'Bestseller men round neck cotton t-shirt with multiple shots.',      '100% Cotton',     'Men'),
(45, 5,  1, 'Men Tapered Fit Flat-Front Trousers',    'Casual men tapered fit flat-front trousers.',                        'Polyester Blend', 'Men'),
(46, 10, 1, 'Girls Round Neck Cotton Top',            'Daily girls round neck cotton top.',                                 '100% Cotton',     'Kids'),
(47, 7,  1, 'Women Round Neck Cotton Top',            'Breathable women round neck cotton top.',                            '100% Cotton',     'Women'),
(48, 4,  1, 'Men Round Neck Pure Cotton T-shirt',     'Plain men round neck pure cotton t-shirt.',                          '100% Cotton',     'Men'),
(49, 7,  1, 'Women Round Neck Cotton Top',            'Soft women round neck cotton top.',                                  '100% Cotton',     'Women'),
(50, 9,  1, 'Women Zip-Front Relaxed Fit Jacket',     'Light women zip-front relaxed fit jacket.',                          'Polyester',       'Women'),
(51, 11, 1, 'Kid Tapered Slim Fit Trouser',           'Premium kid tapered slim fit trouser.',                              'Cotton Blend',    'Kids');

-- ---------------------------------------------------------------------
-- 5) Product Variants: 1 variant mặc định/sản phẩm (size M, color Default).
--    JSON không cung cấp size/color riêng nên đây là biến thể tối thiểu
--    để bảng cart_items + order_details có variant_id hợp lệ tham chiếu.
--    image_url của variant lấy ảnh đầu tiên (image_index = 1) của product.
--    Stock = 100 để test luồng đặt hàng.
-- ---------------------------------------------------------------------
INSERT INTO product_variants (variant_id, product_id, sku, color, size, price, stock_quantity, image_url) VALUES
(1,  1,  'P001-DEF-M', 'Default', 'M', 110.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442069/ecommerce_assets/p_img4.png'),
(2,  2,  'P002-DEF-M', 'Default', 'M', 100.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442105/ecommerce_assets/p_img9.png'),
(3,  3,  'P003-DEF-M', 'Default', 'M', 150.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442000/ecommerce_assets/p_img12.png'),
(4,  4,  'P004-DEF-M', 'Default', 'M', 160.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442004/ecommerce_assets/p_img14.png'),
(5,  5,  'P005-DEF-M', 'Default', 'M', 170.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442020/ecommerce_assets/p_img21.png'),
(6,  6,  'P006-DEF-M', 'Default', 'M', 220.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442030/ecommerce_assets/p_img26.png'),
(7,  7,  'P007-DEF-M', 'Default', 'M', 230.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442034/ecommerce_assets/p_img28.png'),
(8,  8,  'P008-DEF-M', 'Default', 'M', 250.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442052/ecommerce_assets/p_img37.png'),
(9,  9,  'P009-DEF-M', 'Default', 'M', 260.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442056/ecommerce_assets/p_img39.png'),
(10, 10, 'P010-DEF-M', 'Default', 'M', 270.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442060/ecommerce_assets/p_img41.png'),
(11, 11, 'P011-DEF-M', 'Default', 'M', 300.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442062/ecommerce_assets/p_img42.png'),
(12, 12, 'P012-DEF-M', 'Default', 'M', 320.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442080/ecommerce_assets/p_img51.png'),
(13, 13, 'P013-DEF-M', 'Default', 'M', 190.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442018/ecommerce_assets/p_img20.png'),
(14, 14, 'P014-DEF-M', 'Default', 'M', 310.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442076/ecommerce_assets/p_img49.png'),
(15, 15, 'P015-DEF-M', 'Default', 'M', 220.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442046/ecommerce_assets/p_img3.png'),
(16, 16, 'P016-DEF-M', 'Default', 'M', 140.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442099/ecommerce_assets/p_img6.png'),
(17, 17, 'P017-DEF-M', 'Default', 'M', 170.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442008/ecommerce_assets/p_img16.png'),
(18, 18, 'P018-DEF-M', 'Default', 'M', 180.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442012/ecommerce_assets/p_img18.png'),
(19, 19, 'P019-DEF-M', 'Default', 'M', 200.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442022/ecommerce_assets/p_img22.png'),
(20, 20, 'P020-DEF-M', 'Default', 'M', 210.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442026/ecommerce_assets/p_img24.png'),
(21, 21, 'P021-DEF-M', 'Default', 'M', 200.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442032/ecommerce_assets/p_img27.png'),
(22, 22, 'P022-DEF-M', 'Default', 'M', 270.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442050/ecommerce_assets/p_img36.png'),
(23, 23, 'P023-DEF-M', 'Default', 'M', 280.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442054/ecommerce_assets/p_img38.png'),
(24, 24, 'P024-DEF-M', 'Default', 'M', 300.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442072/ecommerce_assets/p_img47.png'),
(25, 25, 'P025-DEF-M', 'Default', 'M', 330.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442074/ecommerce_assets/p_img48.png'),
(26, 26, 'P026-DEF-M', 'Default', 'M', 120.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742441998/ecommerce_assets/p_img11.png'),
(27, 27, 'P027-DEF-M', 'Default', 'M', 190.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442101/ecommerce_assets/p_img7.png'),
(28, 28, 'P028-DEF-M', 'Default', 'M', 310.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442066/ecommerce_assets/p_img44.png'),
(29, 29, 'P029-DEF-M', 'Default', 'M', 290.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442068/ecommerce_assets/p_img45.png'),
(30, 30, 'P030-DEF-M', 'Default', 'M', 130.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442091/ecommerce_assets/p_img5.png'),
(31, 31, 'P031-DEF-M', 'Default', 'M', 140.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442103/ecommerce_assets/p_img8.png'),
(32, 32, 'P032-DEF-M', 'Default', 'M', 110.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742441996/ecommerce_assets/p_img10.png'),
(33, 33, 'P033-DEF-M', 'Default', 'M', 130.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442002/ecommerce_assets/p_img13.png'),
(34, 34, 'P034-DEF-M', 'Default', 'M', 160.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442013/ecommerce_assets/p_img19.png'),
(35, 35, 'P035-DEF-M', 'Default', 'M', 180.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442024/ecommerce_assets/p_img23.png'),
(36, 36, 'P036-DEF-M', 'Default', 'M', 240.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442038/ecommerce_assets/p_img30.png'),
(37, 37, 'P037-DEF-M', 'Default', 'M', 230.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442044/ecommerce_assets/p_img33.png'),
(38, 38, 'P038-DEF-M', 'Default', 'M', 290.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442058/ecommerce_assets/p_img40.png'),
(39, 39, 'P039-DEF-M', 'Default', 'M', 280.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442064/ecommerce_assets/p_img43.png'),
(40, 40, 'P040-DEF-M', 'Default', 'M', 320.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442070/ecommerce_assets/p_img46.png'),
(41, 41, 'P041-DEF-M', 'Default', 'M', 220.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442040/ecommerce_assets/p_img31.png'),
(42, 42, 'P042-DEF-M', 'Default', 'M', 100.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742441994/ecommerce_assets/p_img1.png'),
(43, 43, 'P043-DEF-M', 'Default', 'M', 150.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442010/ecommerce_assets/p_img17.png'),
(44, 44, 'P044-DEF-M', 'Default', 'M', 200.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442038/ecommerce_assets/p_img2_1.png'),
(45, 45, 'P045-DEF-M', 'Default', 'M', 140.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442006/ecommerce_assets/p_img15.png'),
(46, 46, 'P046-DEF-M', 'Default', 'M', 190.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442028/ecommerce_assets/p_img25.png'),
(47, 47, 'P047-DEF-M', 'Default', 'M', 210.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442036/ecommerce_assets/p_img29.png'),
(48, 48, 'P048-DEF-M', 'Default', 'M', 250.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442042/ecommerce_assets/p_img32.png'),
(49, 49, 'P049-DEF-M', 'Default', 'M', 260.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442046/ecommerce_assets/p_img34.png'),
(50, 50, 'P050-DEF-M', 'Default', 'M', 240.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442048/ecommerce_assets/p_img35.png'),
(51, 51, 'P051-DEF-M', 'Default', 'M', 340.00, 100, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442078/ecommerce_assets/p_img50.png');

-- ---------------------------------------------------------------------
-- 6) Product Images: 54 ảnh tổng cộng.
--    - 50 sản phẩm có 1 ảnh (display_order = 1).
--    - Sản phẩm #44 có 4 ảnh (display_order = 1..4) → gallery test case.
-- ---------------------------------------------------------------------
INSERT INTO product_images (product_id, image_url, display_order) VALUES
(1,  'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442069/ecommerce_assets/p_img4.png',  1),
(2,  'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442105/ecommerce_assets/p_img9.png',  1),
(3,  'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442000/ecommerce_assets/p_img12.png', 1),
(4,  'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442004/ecommerce_assets/p_img14.png', 1),
(5,  'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442020/ecommerce_assets/p_img21.png', 1),
(6,  'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442030/ecommerce_assets/p_img26.png', 1),
(7,  'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442034/ecommerce_assets/p_img28.png', 1),
(8,  'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442052/ecommerce_assets/p_img37.png', 1),
(9,  'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442056/ecommerce_assets/p_img39.png', 1),
(10, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442060/ecommerce_assets/p_img41.png', 1),
(11, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442062/ecommerce_assets/p_img42.png', 1),
(12, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442080/ecommerce_assets/p_img51.png', 1),
(13, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442018/ecommerce_assets/p_img20.png', 1),
(14, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442076/ecommerce_assets/p_img49.png', 1),
(15, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442046/ecommerce_assets/p_img3.png',  1),
(16, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442099/ecommerce_assets/p_img6.png',  1),
(17, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442008/ecommerce_assets/p_img16.png', 1),
(18, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442012/ecommerce_assets/p_img18.png', 1),
(19, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442022/ecommerce_assets/p_img22.png', 1),
(20, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442026/ecommerce_assets/p_img24.png', 1),
(21, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442032/ecommerce_assets/p_img27.png', 1),
(22, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442050/ecommerce_assets/p_img36.png', 1),
(23, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442054/ecommerce_assets/p_img38.png', 1),
(24, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442072/ecommerce_assets/p_img47.png', 1),
(25, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442074/ecommerce_assets/p_img48.png', 1),
(26, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742441998/ecommerce_assets/p_img11.png', 1),
(27, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442101/ecommerce_assets/p_img7.png',  1),
(28, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442066/ecommerce_assets/p_img44.png', 1),
(29, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442068/ecommerce_assets/p_img45.png', 1),
(30, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442091/ecommerce_assets/p_img5.png',  1),
(31, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442103/ecommerce_assets/p_img8.png',  1),
(32, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742441996/ecommerce_assets/p_img10.png', 1),
(33, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442002/ecommerce_assets/p_img13.png', 1),
(34, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442013/ecommerce_assets/p_img19.png', 1),
(35, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442024/ecommerce_assets/p_img23.png', 1),
(36, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442038/ecommerce_assets/p_img30.png', 1),
(37, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442044/ecommerce_assets/p_img33.png', 1),
(38, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442058/ecommerce_assets/p_img40.png', 1),
(39, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442064/ecommerce_assets/p_img43.png', 1),
(40, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442070/ecommerce_assets/p_img46.png', 1),
(41, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442040/ecommerce_assets/p_img31.png', 1),
(42, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742441994/ecommerce_assets/p_img1.png',  1),
(43, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442010/ecommerce_assets/p_img17.png', 1),
-- Product 44 có 4 ảnh (gallery)
(44, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442038/ecommerce_assets/p_img2_1.png', 1),
(44, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442040/ecommerce_assets/p_img2_2.png', 2),
(44, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442042/ecommerce_assets/p_img2_3.png', 3),
(44, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442044/ecommerce_assets/p_img2_4.png', 4),
(45, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442006/ecommerce_assets/p_img15.png', 1),
(46, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442028/ecommerce_assets/p_img25.png', 1),
(47, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442036/ecommerce_assets/p_img29.png', 1),
(48, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442042/ecommerce_assets/p_img32.png', 1),
(49, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442046/ecommerce_assets/p_img34.png', 1),
(50, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442048/ecommerce_assets/p_img35.png', 1),
(51, 'https://res.cloudinary.com/driwmi6q7/image/upload/v1742442078/ecommerce_assets/p_img50.png', 1);

-- ---------------------------------------------------------------------
-- 7) Sanity check (uncomment để xem nhanh số liệu sau khi seed)
-- ---------------------------------------------------------------------
-- SELECT COUNT(*) AS total_categories FROM categories;        -- 11
-- SELECT COUNT(*) AS total_brands FROM brands;                -- 1
-- SELECT COUNT(*) AS total_products FROM products;            -- 51
-- SELECT COUNT(*) AS total_variants FROM product_variants;    -- 51
-- SELECT COUNT(*) AS total_images FROM product_images;        -- 54
