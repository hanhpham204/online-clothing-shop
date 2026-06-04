export class CreateProductDto {
  name: string;
  description: string;
  price: number;
  image: string[];
  category: string;
  subCategory: string;
  sizes: string[];
  date?: number;
  bestseller?: boolean;
}
