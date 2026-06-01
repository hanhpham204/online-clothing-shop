import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  fullName?: string;

  @Prop()
  password?: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ default: 'email' }) // 'email' or 'google'
  authProvider: string;

  @Prop()
  phone?: string;

  @Prop()
  address?: string;

  @Prop()
  gender?: string;

  @Prop({ default: 'USER' })
  role: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
