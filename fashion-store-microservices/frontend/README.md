# Frontend Application

This project keeps the existing Next.js frontend code in the repository root `../frontend`.

For the microservices architecture, the frontend must call only API Gateway:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
BACKEND_BASE_URL=http://localhost:8080
```

Example APIs used via gateway:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/products`
- `GET /api/products/{id}`
- `POST /api/cart/items`
- `GET /api/cart`
- `POST /api/orders`
- `GET /api/orders/my-orders`
