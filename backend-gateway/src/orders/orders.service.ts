import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async create(userId: string | undefined, data: CreateOrderDto) {
    let finalUserId = userId;

    if (!finalUserId) {
      if (!data.phone) {
        throw new BadRequestException('Usuário não autenticado ou telefone não fornecido');
      }
      const user = await this.usersService.findOrCreate(data.phone, data.name || 'Cliente Sem Nome');
      finalUserId = user.id;
    }

    const total = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return this.prisma.order.create({
      data: {
        userId: finalUserId,
        tableNumber: data.tableNumber,
        total,
        items: {
          create: data.items.map((item) => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: true },
    });
  }

  findAllByUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: { items: true },
    });
    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }
    return order;
  }

  async update(id: string, userId: string, data: UpdateOrderDto) {
    const order = await this.prisma.order.findFirst({ where: { id, userId } });
    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    return this.prisma.order.update({
      where: { id },
      data: {
        status: data.status,
      },
      include: { items: true },
    });
  }
}
