import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login-auth.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern('signup')
  async signup(@Payload() createUserDto: CreateUserDto) {
    try {
      return await this.authService.signUp(createUserDto);
    } catch (error) {
      throw new RpcException(error.message || 'Signup failed');
    }
  }

  @MessagePattern('login')
  async signin(@Payload() data: LoginDto) {
    try {
      return await this.authService.signIn(data);
    } catch (error) {
      throw new RpcException(error.message || 'Signup failed');
    }
  }

  @MessagePattern('logout')
  async logout(@Payload() req: Request) {
    try {
      return await this.authService.logout(req.headers['sub']);
    } catch (error) {
      throw new RpcException(error.message || 'Logout failed');
    }
  }

  @MessagePattern('validateToken')
  async validate(@Payload() token: string) {
    try {
      return await this.authService.validate(token);
    } catch (error) {
      throw new RpcException(error.message || 'Token validation failed');
    }
  }
}
