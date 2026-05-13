export function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: '#f59e0b',
    PAID: '#10b981',
    PROCESSING: '#3b82f6',
    SHIPPING: '#8b5cf6',
    DELIVERED: '#059669',
    CANCELLED: '#ef4444',
    UNPAID: '#f59e0b',
    REFUNDED: '#6b7280',
  };
  return colors[status] || '#6b7280';
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Chờ thanh toán',
    PAID: 'Đã thanh toán',
    PROCESSING: 'Đang xử lý',
    SHIPPING: 'Đang giao hàng',
    DELIVERED: 'Đã giao',
    CANCELLED: 'Đã hủy',
    UNPAID: 'Chưa thanh toán',
    REFUNDED: 'Đã hoàn tiền',
    COD: 'Thanh toán khi nhận hàng',
  };
  return labels[status] || status;
}

/**
 * Resolves a product image URL.
 * - Absolute URLs (http/https) are returned as-is
 * - Relative API paths (/api/products/images/123) are prefixed with backend base URL
 */
export function resolveImageUrl(imageUrl: string | undefined | null): string {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http')) return imageUrl;
  // Strip /api from NEXT_PUBLIC_API_URL since the imageUrl already contains /api
  const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api').replace(/\/api$/, '');
  return base + imageUrl;
}
