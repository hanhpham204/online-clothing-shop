# Online Clothing Shop

This repository contains the legacy Spring Boot backend, the Next.js frontend, and the new microservices implementation for the graduation project.

## Project Structure

- `backend/`: legacy Spring Boot backend. Keep it until equivalent behavior is fully migrated.
- `frontend/`: Next.js frontend. It should call only the API Gateway with `NEXT_PUBLIC_API_URL=http://localhost:8080`.
- `fashion-store-microservices/`: Eureka, API Gateway, backend microservices, shared libraries, Docker Compose, tests, and migration docs.
- `database/`: legacy database scripts/reference data.

## Main Run Commands

Backend microservices:

```bash
cd fashion-store-microservices
mvn clean test
mvn clean package -DskipTests
docker compose up -d --build
```

Frontend:

```bash
cd frontend
npm install
$env:NEXT_PUBLIC_API_URL="http://localhost:8080"
npm run dev
```

See `fashion-store-microservices/README.md` for module list, ports, APIs, events, Docker details, and current limitations.
