"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    const passwordHash = await bcrypt_1.default.hash('123456', 10);
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
                name: 'Coxinha de Frango',
                description: 'Tradicional coxinha recheada com frango desfiado',
                price: 8.5,
                category: 'Salgado',
            },
            {
                name: 'Escondidinho de Carne',
                description: 'Purê de mandioca coberto com carne seca e queijo',
                price: 29.9,
                category: 'Prato Principal',
            },
            {
                name: 'Suco Natural de Manga',
                description: 'Suco de manga fresca adoçado na medida certa',
                price: 10.0,
                category: 'Bebida',
            },
            {
                name: 'Brownie com Sorvete',
                description: 'Brownie quentinho com bola de sorvete',
                price: 18.0,
                category: 'Sobremesa',
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
//# sourceMappingURL=seed.js.map