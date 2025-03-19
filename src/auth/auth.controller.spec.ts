import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RpcException } from '@nestjs/microservices';
import { LoginDto } from './dto/login-auth.dto';
import { CreateUserDto } from 'src/users/dto/create-user.dto';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;
  const createUserDto: CreateUserDto = {
    email: 'test@example.com', password: 'password123',
    name: 'Test',
    refreshToken: '',
    createdAt: new Date().toISOString()
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            signUp: jest.fn(),
            signIn: jest.fn(),
            logout: jest.fn(),
            validate: jest.fn(),
          },
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  describe('signup', () => {
    it('should register a user and return tokens', async () => {
      const mockTokens = { accessToken: 'access-token', refreshToken: 'refresh-token' };
      jest.spyOn(authService, 'signUp').mockResolvedValue(mockTokens);
      const result = await authController.signup(createUserDto);
      expect(result).toEqual(mockTokens);
      expect(authService.signUp).toHaveBeenCalledWith(createUserDto);
    });

    it('should throw an RpcException if signup fails', async () => {
      jest.spyOn(authService, 'signUp').mockRejectedValue(new Error('Signup error'));
      await expect(authController.signup(createUserDto))
        .rejects.toThrow(RpcException);
    });
  });

  describe('signin', () => {
    it('should log in a user and return tokens', async () => {
      const loginDto: LoginDto = { email: 'test@example.com', password: 'password123' };
      const mockTokens = { accessToken: 'access-token', refreshToken: 'refresh-token' };

      jest.spyOn(authService, 'signIn').mockResolvedValue(mockTokens);

      const result = await authController.signin(loginDto);

      expect(result).toEqual(mockTokens);
      expect(authService.signIn).toHaveBeenCalledWith(loginDto);
    });

    it('should throw an RpcException if login fails', async () => {
      jest.spyOn(authService, 'signIn').mockRejectedValue(new Error('Login error'));
      await expect(authController.signin({ 
        email: createUserDto.email,
        password: createUserDto.password 
      }))
        .rejects.toThrow(RpcException);
    });
  });

  describe('validate', () => {
    it('should validate a token and return decoded data', async () => {
      const token = 'valid-token';
      const mockDecoded = { sub: 1, email: 'test@example.com' };

      jest.spyOn(authService, 'validate').mockResolvedValue(mockDecoded);

      const result = await authController.validate(token);

      expect(result).toEqual(mockDecoded);
      expect(authService.validate).toHaveBeenCalledWith(token);
    });

    it('should throw an RpcException if token validation fails', async () => {
      jest.spyOn(authService, 'validate').mockRejectedValue(new Error('Token validation error'));

      await expect(authController.validate('invalid-token'))
        .rejects.toThrow(RpcException);
    });
  });
});
