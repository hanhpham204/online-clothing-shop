import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const corsOrigins =
    process.env.CORS_ALLOWED_ORIGINS?.split(',').map((origin) =>
      origin.trim(),
    ) || [];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  const port = process.env.PORT ?? 8088;
  await app.listen(port);
  console.log(`Chatbot service is running on: http://localhost:${port}`);
}
bootstrap().catch((err) => console.error('Bootstrap error:', err));
