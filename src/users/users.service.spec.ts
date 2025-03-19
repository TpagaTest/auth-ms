import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
  });

  describe('create', () => {
    it('should create and return a new user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test',
        refreshToken: undefined, 
        createdAt: new Date().toISOString()
      };
  
      const mockUserWithId = {
        ...createUserDto,
        id: 1,
      };
  
      jest.spyOn(userRepo, 'create').mockReturnValue(createUserDto as any);
  
      jest.spyOn(userRepo, 'save').mockResolvedValue(mockUserWithId as any);
  
      const result = await service.create(createUserDto);
  
      expect(result).toEqual(mockUserWithId);
      expect(userRepo.create).toHaveBeenCalledWith(expect.objectContaining(createUserDto));
      expect(userRepo.save).toHaveBeenCalledWith(createUserDto);
    });
  });
  

  describe('findOneByEmail', () => {
    it('should return a user by email', async () => {
      const mockUser = { id: 1, email: 'test@example.com', password: 'hashedpassword' };

      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser as any);

      const result = await service.findOneByEmail('test@example.com');
      expect(result).toEqual(mockUser);
      expect(userRepo.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
    });

    it('should return null if no user is found', async () => {
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(null);

      const result = await service.findOneByEmail('nonexistent@example.com');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update and return the updated user', async () => {
      const updateUserDto: UpdateUserDto = {
        email: 'new@example.com',
        id: 1
      };
      const mockUser = { id: 1, email: 'old@example.com', password: 'hashedpassword' };
      const updatedUser = { ...mockUser, ...updateUserDto };

      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser as any);
      jest.spyOn(userRepo, 'merge').mockImplementation();
      jest.spyOn(userRepo, 'save').mockResolvedValue(updatedUser as any);

      const result = await service.update(1, updateUserDto);
      expect(result).toEqual(updatedUser);
      expect(userRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(userRepo.merge).toHaveBeenCalledWith(mockUser, updateUserDto);
      expect(userRepo.save).toHaveBeenCalledWith(mockUser);
    });

    it('should throw NotFoundException if user is not found', async () => {
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(null);

      await expect(service.update(1, {
        email: 'new@example.com',
        id: 1
      })).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
