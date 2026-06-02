import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { EventsModule } from './events/events.module';
import { ListenersModule } from './listeners/listeners.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGO_URI,
      }),
    }),
    ProductsModule,
    EventsModule,
    ListenersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}


