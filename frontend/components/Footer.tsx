'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem' }}>
            Vogue<span style={{ color: 'var(--color-accent)' }}>Store</span>
          </h4>
          <p style={{ marginTop: 'var(--space-md)' }}>
            Thương hiệu thời trang hàng đầu Việt Nam. Mang đến phong cách hiện đại, chất lượng vượt trội.
          </p>
        </div>
        <div>
          <h4>Danh mục</h4>
          <ul className="footer-links">
            <li><Link href="/products?category=ao">Áo</Link></li>
            <li><Link href="/products?category=quan">Quần</Link></li>
            <li><Link href="/products?category=vay-dam">Váy & Đầm</Link></li>
            <li><Link href="/products?category=phu-kien">Phụ kiện</Link></li>
          </ul>
        </div>
        <div>
          <h4>Hỗ trợ</h4>
          <ul className="footer-links">
            <li><Link href="#">Chính sách đổi trả</Link></li>
            <li><Link href="#">Hướng dẫn mua hàng</Link></li>
            <li><Link href="#">Câu hỏi thường gặp</Link></li>
            <li><Link href="#">Liên hệ</Link></li>
          </ul>
        </div>
        <div>
          <h4>Liên hệ</h4>
          <ul className="footer-links">
            <li>📧 info@voguestore.com</li>
            <li>📞 1900 1234</li>
            <li>📍 TP. Hồ Chí Minh</li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        © {new Date().getFullYear()} VogueStore. All rights reserved.
      </div>
    </footer>
  );
}
