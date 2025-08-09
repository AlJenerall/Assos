import { PrismaClient, QuotaPeriod } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const antenna = await prisma.antenna.upsert({
    where:{ name:'Antenne Ouakam' },
    update:{},
    create:{ name:'Antenne Ouakam' }
  });

  const admin = await prisma.user.upsert({
    where:{ email:'admin@asso.local' },
    update:{},
    create:{
      firstName:'Admin', lastName:'Asso', email:'admin@asso.local', role:'PRESIDENT', antennaId: antenna.id
    }
  });

  await prisma.quotaSetting.upsert({
    where:{ id:1 },
    update:{},
    create:{ period:'YEARLY', amount:50, year:new Date().getFullYear() }
  });

  await prisma.project.create({
    data:{ name:'Projet Jardin', description:'Création d’un jardin partagé', slug:'projet-jardin', status:'ONGOING' }
  });

  await prisma.event.create({
    data:{ title:'Réunion Mensuelle', scope:'GLOBAL', approved:true }
  });

  console.log('Seed done');
}

main().finally(() => prisma.$disconnect());