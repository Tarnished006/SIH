import { PrismaClient } from '@prisma/client';
import { config } from './env.js';

const prismaClientSingleton = () => {
  return new PrismaClient({
    datasourceUrl: config.databaseUrl,
    log: config.nodeEnv === 'development' ? ['warn', 'error'] : ['error'],
  });
};

const globalForPrisma = globalThis;
export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (config.nodeEnv !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
