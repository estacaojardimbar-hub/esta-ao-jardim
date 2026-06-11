import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  create(data: CreateUserDto) {
    return this.prisma.user.create({ data });
  }

  async findOrCreate(phone: string, name?: string) {
    return this.prisma.user.upsert({
      where: { phone },
      update: { name },
      create: { phone, name, email: `${phone}@placeholder.com`, password: '' },
    });
  }
}
