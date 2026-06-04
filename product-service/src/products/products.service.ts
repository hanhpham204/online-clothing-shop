import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: any, // Sử dụng any để tránh lỗi TS1272
  ) {}

  // Helper để dọn sạch các cache danh sách sản phẩm bằng cách lấy danh sách các key đã được tracking
  private async clearProductsListCache() {
    try {
      const keys = await this.cacheManager.get('products:list:keys') as string[];
      if (keys && keys.length > 0) {
        await Promise.all(keys.map((key) => this.cacheManager.del(key)));
      }
      await this.cacheManager.del('products:list:keys');
      this.cacheManager.store; // Giữ để tham chiếu không lỗi
    } catch (err) {
      console.error('Lỗi khi xóa cache danh sách sản phẩm:', err);
    }
  }

  // Helper tracking key danh sách được ghi nhận
  private async trackListCacheKey(key: string) {
    try {
      const keys = (await this.cacheManager.get('products:list:keys')) as string[] || [];
      if (!keys.includes(key)) {
        keys.push(key);
        // Lưu danh sách key với TTL 5 phút tương đương TTL của danh sách cache
        await this.cacheManager.set('products:list:keys', keys, 300 * 1000);
      }
    } catch (err) {
      console.error('Lỗi khi tracking cache key danh sách:', err);
    }
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const createdProduct = new this.productModel(createProductDto);
    const savedProduct = await createdProduct.save();

    // Dọn cache danh sách vì đã có sản phẩm mới
    await this.clearProductsListCache();

    return savedProduct;
  }

  async findAll(query: ProductQueryDto): Promise<{ data: Product[]; pagination: any }> {
    const cacheKey = `products:list:${JSON.stringify(query)}`;
    
    // 1. Kiểm tra cache danh sách trước
    try {
      const cachedData = await this.cacheManager.get(cacheKey);
      if (cachedData) {
        return cachedData as any;
      }
    } catch (err) {
      console.error('Lỗi khi đọc cache danh sách sản phẩm:', err);
    }

    const page = parseInt(query.page as string) || 1;
    const limit = Math.min(parseInt(query.limit as string) || 20, 100);
    const offset = (page - 1) * limit;

    const matchStage: any = {};
    if (query.category) {
      matchStage.category = query.category;
    }
    if (query.subCategory) {
      matchStage.subCategory = query.subCategory;
    }
    if (query.bestseller) {
      matchStage.bestseller = query.bestseller === 'true';
    }

    if (query.search) {
      matchStage.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } }
      ];
    }

    let sortStage: any = { date: -1 };
    if (query.sort) {
      if (query.sort === 'price-asc') {
        sortStage = { price: 1 };
      } else if (query.sort === 'price-desc') {
        sortStage = { price: -1 };
      } else if (query.sort === 'newest') {
        sortStage = { date: -1 };
      }
    }

    const [data, total] = await Promise.all([
      this.productModel.find(matchStage).sort(sortStage).skip(offset).limit(limit).exec(),
      this.productModel.countDocuments(matchStage).exec(),
    ]);

    const result = {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };

    // 2. Ghi kết quả vào cache danh sách (Thời gian sống 5 phút = 300,000 ms)
    try {
      await this.cacheManager.set(cacheKey, result, 300 * 1000);
      // Tracking key này để xóa cache khi có sự thay đổi
      await this.trackListCacheKey(cacheKey);
    } catch (err) {
      console.error('Lỗi khi lưu cache danh sách sản phẩm:', err);
    }

    return result;
  }

  async findOne(id: string): Promise<Product> {
    const cacheKey = `product:detail:${id}`;

    // 1. Kiểm tra cache chi tiết trước
    try {
      const cachedProduct = await this.cacheManager.get(cacheKey);
      if (cachedProduct) {
        return cachedProduct as Product;
      }
    } catch (err) {
      console.error('Lỗi khi đọc cache chi tiết sản phẩm:', err);
    }

    // 2. Query DB nếu cache miss
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // 3. Ghi vào cache chi tiết (Thời gian sống 1 tiếng = 3,600,000 ms)
    try {
      await this.cacheManager.set(cacheKey, product, 3600 * 1000);
    } catch (err) {
      console.error('Lỗi khi lưu cache chi tiết sản phẩm:', err);
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const updatedProduct = await this.productModel
      .findByIdAndUpdate(id, updateProductDto, { new: true })
      .exec();
    if (!updatedProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Xóa cache chi tiết và cache danh sách do thông tin sản phẩm đã đổi
    try {
      await this.cacheManager.del(`product:detail:${id}`);
      await this.clearProductsListCache();
    } catch (err) {
      console.error('Lỗi khi xóa cache khi cập nhật sản phẩm:', err);
    }

    return updatedProduct;
  }

  async remove(id: string): Promise<Product> {
    const deletedProduct = await this.productModel.findByIdAndDelete(id).exec();
    if (!deletedProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Xóa cache chi tiết và cache danh sách khi sản phẩm bị xóa
    try {
      await this.cacheManager.del(`product:detail:${id}`);
      await this.clearProductsListCache();
    } catch (err) {
      console.error('Lỗi khi xóa cache khi xóa sản phẩm:', err);
    }

    return deletedProduct;
  }

  async reserveStock(items: { productId: string; quantity: number }[]): Promise<void> {
    const updatedItems: { productId: string; quantity: number }[] = [];
    try {
      for (const item of items) {
        const product = await this.productModel.findById(item.productId).exec();
        if (!product) {
          throw new Error(`Sản phẩm ${item.productId} không tồn tại`);
        }
        if (product.stock < item.quantity) {
          throw new Error(`Sản phẩm ${product.name} hết hàng (Yêu cầu: ${item.quantity}, Hiện có: ${product.stock})`);
        }
        product.stock -= item.quantity;
        await product.save();
        updatedItems.push(item);
        
        // Xóa cache chi tiết
        void this.cacheManager.del(`product:detail:${item.productId}`).catch(() => {});
      }
      void this.clearProductsListCache().catch(() => {});
    } catch (err) {
      // Rollback stock reservation
      for (const rollbackItem of updatedItems) {
        try {
          const product = await this.productModel.findById(rollbackItem.productId).exec();
          if (product) {
            product.stock += rollbackItem.quantity;
            await product.save();
            void this.cacheManager.del(`product:detail:${rollbackItem.productId}`).catch(() => {});
          }
        } catch (rollbackErr) {
          console.error(`Rollback stock thất bại cho sản phẩm ${rollbackItem.productId}:`, rollbackErr);
        }
      }
      void this.clearProductsListCache().catch(() => {});
      throw err;
    }
  }

  async releaseStock(items: { productId: string; quantity: number }[]): Promise<void> {
    for (const item of items) {
      try {
        const product = await this.productModel.findById(item.productId).exec();
        if (product) {
          product.stock += item.quantity;
          await product.save();
          void this.cacheManager.del(`product:detail:${item.productId}`).catch(() => {});
        }
      } catch (err) {
        console.error(`Release stock thất bại cho sản phẩm ${item.productId}:`, err);
      }
    }
    void this.clearProductsListCache().catch(() => {});
  }
}

