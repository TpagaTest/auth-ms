import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UsersService } from '../users/users.service';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login-auth.dto';
import { envs } from '../config/envs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}
  async signUp(createUserDto: CreateUserDto): Promise<any> {
    const userExists = await this.usersService.findOneByEmail(
      createUserDto.email,
    );
    if (userExists) {
      console.error('User exists')
      throw new BadRequestException('User already exists');
    }
    const hash = await this.hashData(createUserDto.password);
    createUserDto.createdAt = new Date().toISOString();
    createUserDto.refreshToken = "";
    const newUser: any = await this.usersService.create({
      ...createUserDto,
      password: hash,
    });
    const tokens = await this.getTokens(newUser.id, newUser.email);
    await this.updateRefreshToken(newUser.id, tokens.refreshToken);
    return tokens;
  }

	async signIn(data: LoginDto) {
    const user: any = await this.usersService.findOneByEmail(data.email);
    if (!user) throw new BadRequestException('User does not exist');

    const passwordMatches = await argon2.verify(user.password, data.password);
    if (!passwordMatches)
      throw new BadRequestException('Password is incorrect');
    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async me(token: string) {
    const decoded = await this.jwtService.verifyAsync(token, { secret: envs['JWT_ACCESS_SECRET'] });
    const user: any = await this.usersService.findOneById(decoded.sub);
    if (!user) throw new BadRequestException('User does not exist');
    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return {user, ...tokens};
  }

  async validate(token: string) {
    try {
      const decoded = await this.jwtService.verifyAsync(token, { secret: envs['JWT_ACCESS_SECRET'] });
      return decoded;
    } catch (error) {
      throw new BadRequestException('Invalid or expired token');
    }
  }

  async refreshToken(token: string) {
    try {
      const decoded = await this.jwtService.verifyAsync(token, { secret: envs['JWT_REFRESH_SECRET'] });
      const user: any = await this.usersService.findOneById(decoded.sub);
      const tokens = await this.getTokens(user.id, user.email);
      await this.updateRefreshToken(user.id, tokens.refreshToken);
      return tokens;
    } catch (error) {
      throw new BadRequestException('Invalid or expired token');
    }
  }

	async logout(userId: number) {
    return this.usersService.update(userId, {
      refreshToken: undefined,
      id: userId,
    });
  }

  hashData(data: string) {
    return argon2.hash(data);
  }

  async updateRefreshToken(userId: number, refreshToken: string) {
    const hashedRefreshToken = await this.hashData(refreshToken);
    await this.usersService.update(userId, {
      refreshToken: hashedRefreshToken,
      id: userId,
    });
  }

  async getTokens(userId: number, email: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret: envs['JWT_ACCESS_SECRET'],
          expiresIn: '15m',
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret: envs['JWT_REFRESH_SECRET'],
          expiresIn: '7d',
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}