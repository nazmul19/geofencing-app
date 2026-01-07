import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });
    return this.userRepository.save(user);
  }

  findAll() {
    return this.userRepository.find({ relations: ['organization'] });
  }

  findByOrganization(organizationId: string) {
    return this.userRepository.find({
      where: { organizationId },
      relations: ['organization']
    });
  }

  findOne(id: string) {
    return this.userRepository.findOne({ where: { id }, relations: ['organization'] });
  }

  findByEmail(email: string) {
    return this.userRepository.findOne({ where: { email }, relations: ['organization'] });
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return this.userRepository.update(id, updateUserDto);
  }

  remove(id: string) {
    return this.userRepository.delete(id);
  }
}
