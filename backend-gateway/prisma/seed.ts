import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('123456', 10);

  await prisma.user.upsert({
    where: { email: 'admin@estacao.local' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@estacao.local',
      password: passwordHash,
      role: 'ADMIN',
    },
  });

  await prisma.menuItem.createMany({
    data: [
      {
        name: 'Caipirinha Tropical',
        description: 'Cachaça, limão, açúcar e toque de maracujá',
        price: 28.0,
        category: 'Drinks',
      },
      {
        name: 'Chope Artesanal',
        description: 'Copo gelado servido na pressão',
        price: 16.0,
        category: 'Cervejas',
      },
      {
        name: 'Mini Camarão',
        description: 'Camarões crocantes com maionese de limão',
        price: 34.0,
        category: 'Porções',
      },
    ],
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
