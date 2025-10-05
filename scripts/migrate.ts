import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Iniciando migración de base de datos...');

  try {
    // Verificar conexión
    await prisma.$connect();
    console.log('✅ Conectado a la base de datos');

    // Aquí puedes agregar datos iniciales si es necesario
    console.log('📊 Base de datos lista para usar');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Desconectado de la base de datos');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
