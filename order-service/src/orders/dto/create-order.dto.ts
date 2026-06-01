import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  Matches,
} from 'class-validator';

export class OrderItemDto {
  @IsString()
  @IsNotEmpty({ message: 'Product ID must not be empty' })
  productId: string;

  @IsString()
  @IsNotEmpty({ message: 'Product name must not be empty' })
  name: string;

  @IsNumber()
  @Min(0, { message: 'Product price must be greater than or equal to 0' })
  price: number;

  @IsNumber()
  @Min(1, { message: 'Product quantity must be greater than or equal to 1' })
  quantity: number;

  @IsString()
  @IsNotEmpty({ message: 'Product size must not be empty' })
  size: string;

  @IsString()
  @IsOptional()
  image?: string;
}

export class CreateOrderDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email is not valid' })
  email?: string;

  @IsString()
  @IsNotEmpty({ message: 'Recipient full name must not be empty' })
  fullName: string;

  @IsString()
  @IsNotEmpty({ message: 'Recipient phone number must not be empty' })
  @Matches(/(0[3|5|7|8|9])+([0-9]{8})\b/, {
    message: 'Phone number is not a valid Vietnamese format (e.g. 0987654321)',
  })
  phoneNumber: string;

  @IsString()
  @IsNotEmpty({ message: 'Shipping address must not be empty' })
  shippingAddress: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  @IsNotEmpty({ message: 'Cart must not be empty' })
  items: OrderItemDto[];

  @IsEnum(['COD', 'BANK_TRANSFER'], {
    message: 'Payment method must be COD or BANK_TRANSFER',
  })
  paymentMethod: string;
}
