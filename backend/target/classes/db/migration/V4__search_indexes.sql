-- V4: Indexes for search performance

-- Price range queries
CREATE INDEX IF NOT EXISTS idx_products_base_price ON products (base_price);
CREATE INDEX IF NOT EXISTS idx_products_sale_price ON products (sale_price);

-- Composite: active + category for filtered listing
CREATE INDEX IF NOT EXISTS idx_products_active_category ON products (is_active, category_id);

-- Featured products lookup
CREATE INDEX IF NOT EXISTS idx_products_featured ON products (is_featured) WHERE is_featured = TRUE;

-- Variant filters (size, color)
CREATE INDEX IF NOT EXISTS idx_variants_size ON product_variants (size);
CREATE INDEX IF NOT EXISTS idx_variants_color ON product_variants (color);

-- Name search: B-tree on lower(name) for ILIKE performance
CREATE INDEX IF NOT EXISTS idx_products_name_lower ON products (LOWER(name) varchar_pattern_ops);
