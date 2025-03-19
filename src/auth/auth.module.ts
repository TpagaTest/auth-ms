import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { envs } from 'src/config/envs';

@Module({
  imports: [
    JwtModule.register({
      secret: envs.JWT_ACCESS_SECRET || 'default_secret',
      signOptions: { expiresIn: '1h' },
    }),
    UserModule],  
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService], 
})
export class AuthModule {}
