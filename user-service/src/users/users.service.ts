import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Otp, OtpDocument } from './schemas/otp.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Otp.name) private otpModel: Model<OtpDocument>,
  ) {}

  async findUserByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async createUser(userData: Partial<User>): Promise<UserDocument> {
    const user = new this.userModel(userData);
    return user.save();
  }

  async updateUser(email: string, updateData: Partial<User>): Promise<UserDocument | null> {
    return this.userModel.findOneAndUpdate({ email }, updateData, { new: true }).exec();
  }

  async createOtp(email: string, otpCode: string, expiresAt: Date): Promise<OtpDocument> {
    // Delete existing OTPs for this email first
    await this.otpModel.deleteMany({ email }).exec();
    
    const otp = new this.otpModel({ email, otpCode, expiresAt });
    return otp.save();
  }

  async getOtp(email: string, otpCode: string): Promise<OtpDocument | null> {
    return this.otpModel.findOne({ email, otpCode }).exec();
  }

  async deleteOtp(email: string): Promise<void> {
    await this.otpModel.deleteMany({ email }).exec();
  }
}
