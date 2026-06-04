import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const corsOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(",").map((origin) =>
    origin.trim(),
  );

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  }); // allow credentials for cookies
  
  app.use(cookieParser());
  await app.listen(process.env.PORT ?? 8081);
}
bootstrap();
