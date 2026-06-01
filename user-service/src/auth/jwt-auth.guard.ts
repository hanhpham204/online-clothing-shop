import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private configService: ConfigService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const protectedEndpoints = this.configService.get<string>('PROTECTED_ENDPOINTS', '');
    
    // If PROTECTED_ENDPOINTS is empty, you can either protect all or none. 
    // Here we protect only if the path is in the comma-separated list.
    const endpointsList = protectedEndpoints.split(',').map(e => e.trim()).filter(Boolean);
    
    // Check if current path starts with any of the protected endpoints
    const isProtected = endpointsList.some(endpoint => request.path.startsWith(endpoint));

    if (!isProtected) {
      return true; // Allow access without authentication
    }

    return super.canActivate(context); // Run JWT validation
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication required');
    }
    return user;
  }
}
