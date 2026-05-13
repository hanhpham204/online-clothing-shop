export interface User {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  role: 'USER' | 'ADMIN';
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string | null;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface SessionInfo {
  id: number;
  deviceName: string;
  browser: string;
  os: string;
  ipAddress: string;
  approximateLocation: string;
  userAgent: string;
  createdAt: string;
  lastActiveAt: string;
  expiresAt: string;
  currentSession: boolean;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  material: string;
  brand: string;
  categoryId: number;
  categoryName: string;
  basePrice: number;
  salePrice: number | null;
  effectivePrice: number;
  isActive: boolean;
  isFeatured: boolean;
  viewCount: number;
  avgRating: number | null;
  reviewCount: number;
  images: ProductImage[];
  variants: ProductVariant[];
  createdAt: string;
}

export interface ProductImage {
  id: number;
  imageUrl: string;
  altText: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface ProductVariant {
  id: number;
  size: string;
  color: string;
  colorCode: string;
  sku: string;
  stockQuantity: number;
  additionalPrice: number;
  finalPrice: number;
}

export interface CartItem {
  id: number;
  variantId: number;
  productId: number;
  productName: string;
  productSlug: string;
  imageUrl: string;
  size: string;
  color: string;
  colorCode: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  stockQuantity: number;
}

export interface Cart {
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
}

export interface Order {
  id: number;
  orderCode: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentCode: string;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  note: string;
  paidAt: string | null;
  createdAt: string;
  items: OrderItem[];
  qrCodeUrl: string | null;
}

export interface OrderItem {
  id: number;
  productName: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  children?: Category[];
}

export interface Address {
  id: number;
  fullName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  streetAddress: string;
  isDefault: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: string[];
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

export interface Statistics {
  totalRevenue: number;
  todayRevenue: number;
  monthRevenue: number;
  totalOrders: number;
  todayOrders: number;
  pendingOrders: number;
  totalUsers: number;
  totalProducts: number;
}
