import { Controller, Get } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get('test')
  async test() {
    return this.service.findOrCreate('11999999999', 'Cliente Teste');
  }
}
