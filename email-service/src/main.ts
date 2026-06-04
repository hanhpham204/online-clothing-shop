import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 8087);
  await app.listen(port);
  new Logger('Bootstrap').log(`Email service listening on port ${port}`);
}
void bootstrap();
