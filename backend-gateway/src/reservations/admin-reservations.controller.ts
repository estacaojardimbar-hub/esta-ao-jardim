import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { ReservationsService } from './reservations.service';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { PrismaService } from '../prisma/prisma.service';

@Controller('admin/reservations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminReservationsController {
  constructor(
    private readonly reservationsService: ReservationsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async findAll() {
    return this.prisma.reservation.findMany({
      include: { user: true },
      orderBy: { date: 'desc' },
    });
  }

  @Patch(':id')
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateReservationDto) {
    return this.prisma.reservation.update({
      where: { id },
      data: { status: dto.status },
    });
  }
}
