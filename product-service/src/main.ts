import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const corsOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(",").map((origin) =>
    origin.trim(),
  );

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });
  
  await app.listen(process.env.PORT ?? 8083);
}
bootstrap();
