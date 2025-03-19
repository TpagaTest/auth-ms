import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { LoginDto } from './dto/login-auth.dto';
import { envs } from '../config/envs';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  const createUserDto: CreateUserDto = {
    email: 'test@example.com', password: 'password123',
    name: 'Test',
    refreshToken: '',
    createdAt: new Date().toISOString()
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findOneByEmail: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('signUp', () => {
    it('should create a new user and return tokens', async () => {
      
      const hashedPassword = 'hashedpassword';
      const mockUser:any = { ...createUserDto, id: 1, password: hashedPassword };

      jest.spyOn(usersService, 'findOneByEmail').mockResolvedValue(null);
      jest.spyOn(argon2, 'hash').mockResolvedValue(hashedPassword);
      jest.spyOn(usersService, 'create').mockResolvedValue(mockUser);
      jest.spyOn(authService, 'getTokens').mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      jest.spyOn(authService, 'updateRefreshToken').mockResolvedValue(undefined);

      const result = await authService.signUp(createUserDto);
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      expect(usersService.findOneByEmail).toHaveBeenCalledWith(createUserDto.email);
      expect(usersService.create).toHaveBeenCalled();
      expect(authService.getTokens).toHaveBeenCalledWith(mockUser.id, mockUser.email);
      expect(authService.updateRefreshToken).toHaveBeenCalledWith(mockUser.id, 'refresh-token');
    });

    it('should throw an error if user already exists', async () => {
      jest.spyOn(usersService, 'findOneByEmail').mockResolvedValue({ 
        id: 1,
        ...createUserDto,
        refreshToken: '',
        createdAt: new Date()
       });

      await expect(authService.signUp(createUserDto))
      .rejects.toThrow(BadRequestException);
    });
  });

  describe('signIn', () => {
    it('should return tokens if credentials are correct', async () => {
      const loginDto: LoginDto = { email: createUserDto.email, password: createUserDto.password };
      const mockUser:any = { id: 1, email: loginDto.email, password: 'hashedpassword' };

      jest.spyOn(usersService, 'findOneByEmail').mockResolvedValue(mockUser);
      jest.spyOn(argon2, 'verify').mockResolvedValue(true);
      jest.spyOn(authService, 'getTokens').mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      jest.spyOn(authService, 'updateRefreshToken').mockResolvedValue(undefined);

      const result = await authService.signIn(loginDto);
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      expect(usersService.findOneByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(authService.updateRefreshToken).toHaveBeenCalledWith(mockUser.id, 'refresh-token');
    });

    it('should throw an error if user does not exist', async () => {
      jest.spyOn(usersService, 'findOneByEmail').mockResolvedValue(null);

      await expect(authService.signIn({ email: createUserDto.email, password: 'password' }))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw an error if password is incorrect', async () => {
      jest.spyOn(usersService, 'findOneByEmail').mockResolvedValue({ 
        ...createUserDto,
        id: 1,
        refreshToken: '',
        createdAt: new Date(),
        password: 'hashedpassword' });
      jest.spyOn(argon2, 'verify').mockResolvedValue(false);

      await expect(authService.signIn({ email: createUserDto.email, password: 'wrongpassword' }))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('validate', () => {
    it('should return decoded token if valid', async () => {
      const decodedToken = { sub: 1, email: createUserDto.email };

      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(decodedToken);

      const result = await authService.validate('valid-token');
      expect(result).toEqual(decodedToken);
    });

    it('should throw an error if token is invalid', async () => {
      jest.spyOn(jwtService, 'verifyAsync').mockRejectedValue(new Error('Invalid token'));

      await expect(authService.validate('invalid-token'))
        .rejects.toThrow(BadRequestException);
    });
  });
});
