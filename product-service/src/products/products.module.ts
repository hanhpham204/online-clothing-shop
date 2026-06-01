import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product, ProductSchema } from './schemas/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    CacheModule.registerAsync({
      useFactory: async () => {
        const store = await redisStore({
          socket: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
          },
          password: process.env.REDIS_PASSWORD || undefined,
        });
        
        // Register error handler to prevent unhandled 'error' event crash on ECONNRESET
        if (store.client) {
          store.client.on('error', (err: any) => {
            console.error('Redis client connection error:', err);
          });
        }

        return { store: store as any };
      },
    }),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
