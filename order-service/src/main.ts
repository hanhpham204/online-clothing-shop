import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // CORS configuration
  const corsOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(",").map((origin) =>
    origin.trim(),
  ) || [];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Enable validation pipe globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 8084);
}
bootstrap();
