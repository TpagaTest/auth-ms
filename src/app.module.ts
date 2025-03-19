import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/entities/user.entity';
import { UserModule } from './users/users.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    database: 'tpaga',
    password: 'postgres',
    entities: [User],
    synchronize: false,
    retryDelay: 3000,
    retryAttempts: 10,
  }),
  AuthModule,
  UserModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
