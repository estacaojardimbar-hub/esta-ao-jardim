import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { ReservationsController } from './reservations.controller';
import { AdminReservationsController } from './admin-reservations.controller';
import { ReservationsService } from './reservations.service';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [ReservationsController, AdminReservationsController],
  providers: [ReservationsService],
})
export class ReservationsModule {}
