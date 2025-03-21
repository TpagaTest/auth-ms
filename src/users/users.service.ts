import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User) private UserRepo: Repository<User>
  ) {}

  async create(createUserDto: CreateUserDto) {
    createUserDto.createdAt = new Date().toISOString();
    const newUser = this.UserRepo.create(createUserDto);
    const userSaved = await this.UserRepo.save(newUser)
    return userSaved;
  }
  
  findOneByEmail(email: string) {
    return this.UserRepo.findOne({where: {email}});
  }

  findOneById(id: number) {
    return this.UserRepo.findOne({where: {id}});
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.UserRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    this.UserRepo.merge(user, updateUserDto);
    return this.UserRepo.save(user);
  }

}
