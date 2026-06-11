import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';

@Injectable()
export class ReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async create(userId: string | undefined, data: CreateReservationDto) {
    let finalUserId = userId;

    if (!finalUserId) {
      if (!data.phone) {
        throw new BadRequestException('Usuário não autenticado ou telefone não fornecido');
      }
      const user = await this.usersService.findOrCreate(data.phone, data.name || 'Cliente Sem Nome');
      finalUserId = user.id;
    }

    return this.prisma.reservation.create({
      data: {
        userId: finalUserId,
        date: new Date(data.date),
        time: data.time,
        guests: data.guests,
        notes: data.notes,
      },
    });
  }

  findAllByUser(userId: string) {
    return this.prisma.reservation.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
  }

  async update(id: string, userId: string, data: UpdateReservationDto) {
    const reservation = await this.prisma.reservation.findFirst({ where: { id, userId } });
    if (!reservation) {
      throw new NotFoundException('Reserva não encontrada');
    }

    return this.prisma.reservation.update({
      where: { id },
      data: {
        date: data.date ? new Date(data.date) : undefined,
        time: data.time,
        guests: data.guests,
        notes: data.notes,
        status: data.status,
      },
    });
  }

  async remove(id: string, userId: string) {
    const reservation = await this.prisma.reservation.findFirst({ where: { id, userId } });
    if (!reservation) {
      throw new NotFoundException('Reserva não encontrada');
    }
    return this.prisma.reservation.delete({ where: { id } });
  }
}
