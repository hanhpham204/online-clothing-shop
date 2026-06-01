import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: false, collection: 'products' })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  price: number;

  @Prop({ type: [String], required: true })
  image: string[];

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  subCategory: string;

  @Prop({ type: [String], required: true })
  sizes: string[];

  @Prop({ default: () => Date.now() })
  date: number;

  @Prop({ default: false })
  bestseller: boolean;

  @Prop({ type: [Number], default: [] })
  embedding?: number[];
}

export const ProductSchema = SchemaFactory.createForClass(Product);
