/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Product, ProductDocument } from './schemas/product.schema';
import { User, UserDocument } from './schemas/user.schema';

export interface ChatHistoryItem {
  role: string;
  text: string;
}

export interface ProfileUpdateArgs {
  fullName?: string;
  phone?: string;
  address?: string;
  gender?: string;
}

export interface CartItemPayload {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  qty: number;
}

export interface CartAction {
  type: 'ADD_TO_CART';
  payload: CartItemPayload;
}

@Injectable()
export class AppService {
  private genAI: GoogleGenerativeAI;

  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      console.warn(
        'WARNING: GEMINI_API_KEY is not defined in the environment variables.',
      );
    }
    this.genAI = new GoogleGenerativeAI(apiKey || '');
  }

  // ── Generates 768-dimension embedding for query text ──
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-embedding-2',
      });
      const result = await model.embedContent({
        content: { parts: [{ text }] },
        outputDimensionality: 768,
      } as any);
      if (!result?.embedding?.values) {
        throw new Error('Failed to generate embedding from Gemini API.');
      }
      return result.embedding.values;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('Error generating embedding:', msg);
      throw new BadRequestException('Error generating embedding: ' + msg);
    }
  }

  // ── Vector Search database handler ──
  private async searchProducts(query: string): Promise<any[]> {
    try {
      const queryVector = await this.generateEmbedding(query);

      const results = await this.productModel
        .aggregate([
          {
            $vectorSearch: {
              index: 'vector_index',
              path: 'embedding',
              queryVector: queryVector,
              numCandidates: 20,
              limit: 5,
            },
          },
          {
            $project: {
              embedding: 0,
              score: { $meta: 'vectorSearchScore' },
            },
          },
        ])
        .exec();

      return results;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('Vector search failed:', msg);
      return [];
    }
  }

  // ── Add to Cart database lookup ──
  private async lookupProductForCart(
    productId: string,
    quantity: number,
    actions: CartAction[],
  ): Promise<any> {
    try {
      const product = await this.productModel.findById(productId).exec();
      if (!product) {
        return { success: false, error: 'Product not found' };
      }

      const cartItem: CartItemPayload = {
        id: product._id.toString(),
        name: product.name,
        category: product.category,
        price: product.price,
        image: product.image?.[0] || '',
        qty: quantity,
      };

      actions.push({
        type: 'ADD_TO_CART',
        payload: cartItem,
      });

      return {
        success: true,
        message: `Successfully added ${product.name} to cart.`,
        product: cartItem,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('Error looking up product for cart:', msg);
      return { success: false, error: msg };
    }
  }

  // ── Update profile database handler ──
  private async updateUserProfile(
    email: string | undefined,
    args: ProfileUpdateArgs,
  ): Promise<any> {
    if (!email) {
      return {
        success: false,
        error: 'User is not authenticated. Please log in first.',
      };
    }

    try {
      const updateData: ProfileUpdateArgs = {};
      if (args.fullName) updateData.fullName = args.fullName;
      if (args.phone) updateData.phone = args.phone;
      if (args.address) updateData.address = args.address;
      if (args.gender) updateData.gender = args.gender;

      if (Object.keys(updateData).length === 0) {
        return {
          success: false,
          error: 'No profile details provided to update.',
        };
      }

      const updated = await this.userModel
        .findOneAndUpdate({ email }, { $set: updateData }, { new: true })
        .exec();

      if (!updated) {
        return { success: false, error: 'User not found in database.' };
      }

      return {
        success: true,
        message: 'Profile updated successfully.',
        user: {
          email: updated.email,
          fullName: updated.fullName,
          phone: updated.phone,
          address: updated.address,
          gender: updated.gender,
        },
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('Error updating user profile:', msg);
      return { success: false, error: msg };
    }
  }

  // ── Main Chatbot processing method with Tool Calling loop ──
  async chat(
    message: string,
    clientHistory: ChatHistoryItem[],
    userEmail?: string,
  ): Promise<{ reply: string; actions: CartAction[] }> {
    const actions: CartAction[] = [];

    // Map history to Google Gen AI format
    const history = clientHistory.map((item) => ({
      role: item.role === 'user' ? 'user' : 'model',
      parts: [{ text: item.text }],
    }));

    // Google Gen AI requires the first message in the chat history to be from 'user'.
    // If the first message is from 'model' (such as our welcome message), we drop it.
    while (history.length > 0 && history[0].role === 'model') {
      history.shift();
    }

    const tools = [
      {
        functionDeclarations: [
          {
            name: 'search_products',
            description:
              'Tìm kiếm sản phẩm trong cửa hàng thời trang LUA LA dựa trên mô tả hoặc từ khóa tìm kiếm (Ví dụ: "áo thun nam", "váy nữ màu trắng").',
            parameters: {
              type: 'OBJECT',
              properties: {
                query: {
                  type: 'STRING',
                  description:
                    'Nội dung tìm kiếm sản phẩm hoặc mô tả kiểu dáng, chất liệu, màu sắc mong muốn.',
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'add_to_cart',
            description:
              'Thêm một sản phẩm cụ thể vào giỏ hàng của người dùng.',
            parameters: {
              type: 'OBJECT',
              properties: {
                productId: {
                  type: 'STRING',
                  description: 'ID của sản phẩm cần thêm vào giỏ hàng.',
                },
                quantity: {
                  type: 'NUMBER',
                  description: 'Số lượng sản phẩm muốn mua (Mặc định là 1).',
                },
              },
              required: ['productId'],
            },
          },
          {
            name: 'update_user_profile',
            description:
              'Cập nhật thông tin hồ sơ của người dùng đang đăng nhập (Tên, Số điện thoại, Địa chỉ giao hàng, Giới tính).',
            parameters: {
              type: 'OBJECT',
              properties: {
                fullName: {
                  type: 'STRING',
                  description: 'Họ và tên đầy đủ mới.',
                },
                phone: {
                  type: 'STRING',
                  description: 'Số điện thoại liên lạc mới.',
                },
                address: {
                  type: 'STRING',
                  description: 'Địa chỉ giao nhận hàng mới.',
                },
                gender: {
                  type: 'STRING',
                  description: 'Giới tính mới ("Male", "Female", "Other").',
                },
              },
            },
          },
        ],
      },
    ];

    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.5-flash-lite',
        tools: tools as any,
        systemInstruction: `Bạn là trợ lý ảo hỗ trợ khách hàng của cửa hàng thời trang LUA LA.
Trạng thái đăng nhập hiện tại của khách hàng: ${userEmail ? `ĐÃ ĐĂNG NHẬP (Email: ${userEmail})` : 'CHƯA ĐĂNG NHẬP (Guest/Khách vãng lai)'}.

Nhiệm vụ của bạn:
1. Tư vấn và tìm kiếm sản phẩm cho khách hàng bằng cách gọi function "search_products".
2. Hỗ trợ khách hàng thêm sản phẩm vào giỏ hàng bằng cách gọi function "add_to_cart" (CHỈ CHO PHÉP KHI ĐÃ ĐĂNG NHẬP).
3. Hỗ trợ cập nhật thông tin cá nhân (Họ tên, SĐT, Địa chỉ, Giới tính) bằng cách gọi function "update_user_profile" (CHỈ CHO PHÉP KHI ĐÃ ĐĂNG NHẬP).

Lưu ý quan trọng:
- Nếu người dùng CHƯA ĐĂNG NHẬP mà yêu cầu thêm vào giỏ hàng hoặc cập nhật thông tin hồ sơ, bạn KHÔNG ĐƯỢC gọi function. Hãy trả lời từ chối lịch sự và giải thích rằng họ cần đăng nhập trước để thực hiện tính năng này.
- Luôn thân thiện, lễ phép và sử dụng Tiếng Việt.
- Khi khách hàng hỏi hoặc tìm kiếm sản phẩm nói chung, hãy LUÔN sử dụng công cụ "search_products" để truy vấn sản phẩm thực tế từ cơ sở dữ liệu trước khi trả lời. Tuyệt đối không tự bịa ra sản phẩm.`,
      });

      const chatSession = model.startChat({ history });
      let result = await chatSession.sendMessage(message);

      let functionCalls = result.response.functionCalls();

      // Handle function calling loop
      while (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
        const { name, args } = call;
        const callArgs = args as Record<string, unknown>;
        let toolResult: any;

        if (name === 'search_products') {
          toolResult = await this.searchProducts(callArgs.query as string);
        } else if (name === 'add_to_cart') {
          if (!userEmail) {
            toolResult = {
              success: false,
              error:
                'Khách hàng chưa đăng nhập. Vui lòng thông báo cho họ cần đăng nhập trước để thêm vào giỏ hàng.',
            };
          } else {
            const qty = (callArgs.quantity as number) || 1;
            toolResult = await this.lookupProductForCart(
              callArgs.productId as string,
              qty,
              actions,
            );
          }
        } else if (name === 'update_user_profile') {
          toolResult = await this.updateUserProfile(userEmail, callArgs);
        }

        // Send the function response back to the model
        result = await chatSession.sendMessage([
          {
            functionResponse: {
              name,
              response: { result: toolResult },
            },
          },
        ]);

        functionCalls = result.response.functionCalls();
      }

      return {
        reply: result.response.text(),
        actions,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('Error during chat processing:', msg);
      return {
        reply:
          'Rất tiếc, đã xảy ra sự cố trong quá trình xử lý yêu cầu của bạn. Xin vui lòng thử lại sau.',
        actions: [],
      };
    }
  }
}
