import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

export class CheckoutItemDto {
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

export class CreateCheckoutIntentDto {
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
  @ArrayMinSize(1, { message: 'Cart must not be empty' })
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items: CheckoutItemDto[];

  @IsEnum(['BANK_TRANSFER'], {
    message: 'Checkout intent only supports BANK_TRANSFER',
  })
  paymentMethod: 'BANK_TRANSFER';
}
