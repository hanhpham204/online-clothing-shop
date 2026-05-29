# Fashion Store Microservices

Graduation-project-friendly microservices refactor of the original Fashion Store monolith. The frontend should call only the API Gateway:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Modules

- `eureka-server`: service discovery
- `api-gateway`: gateway routing, JWT validation, role authorization, trusted user headers
- `auth-service`: register/login, Google login, email OTP verify/resend, refresh-token rotation/revocation, admin users
- `user-service`: user profile API
- `product-service`: products, categories, brands, variants, images, filtering/search, Redis cache
- `cart-service`: Redis cart API, clears cart on `order.paid`
- `order-service`: order creation and event-driven order saga state
- `inventory-service`: stock API and inventory reservation consumer
- `payment-service`: mock payment consumer and payment events
- `notification-service`: notification log/email consumer
- `common-lib/common-dto`: shared API response wrapper
- `common-lib/common-event`: shared event payloads, routing keys, Rabbit JSON/retry config
- `common-lib/common-exception`: shared error response and business exception

## Ports

| Service | Port |
| --- | --- |
| Eureka | `8761` |
| API Gateway | `8080` |
| Auth | `8081` |
| User | `8082` |
| Product | `8083` |
| Cart | `8084` |
| Order | `8085` |
| Payment | `8086` |
| Inventory | `8087` |
| Notification | `8088` |
| MySQL | `3306` |
| Redis | `6379` |
| RabbitMQ | `5672`, management `15672` |

## Key APIs

Public through gateway:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `POST /api/auth/verify-email-otp`
- `POST /api/auth/resend-email-otp`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

Protected through gateway:
- `GET /api/products`, `GET /api/products/{idOrSlug}`
- `GET /api/products/search`, `GET /api/products/filters`, `GET /api/products/suggest`
- `GET /api/categories`, `GET /api/categories/all`, `GET /api/brands`, `GET /api/sizes`, `GET /api/colors`
- `GET /api/cart`, `POST /api/cart/items`, `PUT /api/cart/items/{variantId}`, `DELETE /api/cart/items/{variantId}`
- `POST /api/orders`, `GET /api/orders`, `GET /api/orders/{orderId}`, `PUT /api/orders/{orderId}/cancel`
- `GET /api/inventory/{productId}`, `PUT /api/inventory/{productId}?quantity=...`
- `GET /api/payments/{id}`
- `GET /api/notifications/latest`

Admin only through gateway:
- `GET /api/admin/users`
- `PUT /api/admin/users/{userId}/status`
- `POST /api/admin/products`, `PUT /api/admin/products/{id}`, `DELETE /api/admin/products/{id}`
- `POST /api/admin/products/{id}/images`, `DELETE /api/admin/products/images/{imageId}`
- `POST /api/admin/categories`

## Security

- Only `/api/auth/**` is public at the gateway.
- All other routes require a valid access JWT with `type=access`.
- `/api/admin/**` additionally requires `role=ADMIN`.
- Gateway forwards trusted `X-User-Id`, `X-User-Email`, and `X-User-Role` headers to downstream services.
- Auth refresh tokens are persisted by `jti`, rotated on refresh, revoked on logout, and reuse detection revokes all active refresh tokens for that user.

## Event Catalog

Exchange: `fashion.exchange`

DLX: `fashion.dlx`

| Routing key | Publisher | Consumers | Purpose |
| --- | --- | --- | --- |
| `user.registered` | auth-service | notification-service | welcome/registration notification |
| `product.updated` | product-service | future consumers | product cache/search sync hook |
| `order.created` | order-service | inventory-service, notification-service | start order saga |
| `inventory.reserved` | inventory-service | payment-service, order-service | inventory reservation success |
| `inventory.failed` | inventory-service | order-service | inventory reservation failure |
| `payment.completed` | payment-service | order-service, notification-service | mock payment success |
| `payment.failed` | payment-service | order-service, notification-service | mock payment failure |
| `order.paid` | order-service | notification-service, cart-service | order finalized as paid |
| `cart.cleared` | cart-service | future consumers | cart cleared after paid order |
| `order.cancelled` | order-service | notification-service | order cancellation |

Consumers use JSON conversion, retry, DLQ settings, event payload logging, and an in-memory `eventId` idempotency guard.

## Redis Usage

- `auth-service`: email OTP key `auth:email-otp:{email}` with configurable TTL.
- `product-service`: product list `5m`, product detail `10m`, category list `30m`, with invalidation on product/category changes.
- `cart-service`: cart key `cart:user:{userId}` with `24h` TTL.

## Environment variables

All services read configuration from the **root** `.env` file (never commit it).

1. Copy the template: `cp .env.example .env` (from repo root).
2. Set required secrets: `JWT_SECRET`, `MYSQL_ROOT_PASSWORD`, `RABBITMQ_PASSWORD`, `MAIL_*`, `APP_ADMIN_PASSWORD`, etc.
3. Run with Docker Compose — each service uses `env_file: .env` plus Docker host overrides (`mysql`, `redis`, `rabbitmq` hostnames).

`application.yml` files use `${ENV_VAR}` placeholders only. **No JWT, DB password, or mail credentials are hardcoded** in source.

For local `mvn spring-boot:run`, export variables from `.env` (IDE EnvFile plugin, or PowerShell `Get-Content .env | ForEach-Object { ... }`).

See `ops/application-env.common.yml` for the shared binding patterns.

## Run Steps

Build and test:

```bash
cd fashion-store-microservices
mvn clean test
mvn clean package -DskipTests
```

Run infrastructure and services with Docker:

```bash
# From repo root (where .env and docker-compose.yml live)
cp .env.example .env   # then edit secrets
docker compose up -d --build
```

Run frontend:

```bash
cd ../frontend
npm install
$env:NEXT_PUBLIC_API_URL="http://localhost:8080"
npm run dev
```

Useful local backend command on this machine if Maven picks an unreadable JDK:

```powershell
$env:JAVA_HOME="C:\Users\nhocn\.jdks\ms-17.0.16"
$env:Path="$env:JAVA_HOME\bin;$env:Path"
mvn test
```

## Known Limitations / TODO

- Payment is still a mock service; success rate is controlled by `PAYMENT_MOCK_SUCCESS_RATE` and defaults to `100`.
- Product image upload currently stores generated image URLs; durable file/object storage is still TODO.
- Event idempotency is in-memory. Persist processed event IDs for production-grade duplicate handling.
- Search is database-backed with JPA specifications; a real search index is a future improvement.
- Direct service ports are exposed for development. In production, only the gateway should be public.
- Admin seed credentials come from `APP_ADMIN_EMAIL` and `APP_ADMIN_PASSWORD` in `.env` only.
