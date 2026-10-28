import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import { DataSource, DeepPartial, FindOptionsWhere, ObjectLiteral, Repository } from 'typeorm';
import { AppModule } from '../app.module';
import { Maintenance } from '../maintenances/entities/maintenance.entity';
import { MaintenanceStatus, MaintenanceType } from '../maintenances/enums/maintenance.enums';
import { Mechanic } from '../mechanics/entities/mechanic.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/enums/role.enum';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { VehicleStatus } from '../vehicles/enums/vehicle-status.enum';
import { Workshop } from '../workshops/entities/workshop.entity';

/*busca por un dato unico; si ya existe lo reutiliza, si no, lo crea.
Por eso ejecutar el seeder dos veces no duplica registros*/
async function findOrCreate<T extends ObjectLiteral>(
  repo: Repository<T>,
  where: FindOptionsWhere<T>,
  data: DeepPartial<T>,
): Promise<T> {
  const existing = await repo.findOne({ where });
  if (existing) return existing;
  return repo.save(repo.create(data) as T);
}

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const ds = app.get(DataSource);

  const users = ds.getRepository(User);
  const mechanics = ds.getRepository(Mechanic);
  const workshops = ds.getRepository(Workshop);
  const vehicles = ds.getRepository(Vehicle);
  const maintenances = ds.getRepository(Maintenance);

  //1 ADMIN + 2 TECHNICIAN
  const admin = await findOrCreate(users, { email: 'admin@fleetcore.com' }, {
    name: 'Administrador', email: 'admin@fleetcore.com',
   password: await bcrypt.hash('Admin123*', 10),
  });
  const tech1 = await findOrCreate(users, { email: 'tech1@fleetcore.com' }, {
    name: 'Carlos Pérez', email: 'tech1@fleetcore.com',
   password: await bcrypt.hash('Tech123*', 10),
  });
  const tech2 = await findOrCreate(users, { email: 'tech2@fleetcore.com' }, {
    name: 'Laura Gómez', email: 'tech2@fleetcore.com',
    password: await bcrypt.hash('Tech123*', 10),
  });

  //3 mecanicos: 2 activos vinculados a los técnicos y 1 inactivo
  const carlos = await findOrCreate(mechanics, { email: 'carlos.perez@fleetcore.com' }, {
    name: 'Carlos Pérez', email: 'carlos.perez@fleetcore.com',
    specialty: 'Motor', isActive: true, user: tech1,
  });
  const laura = await findOrCreate(mechanics, { email: 'laura.gomez@fleetcore.com' }, {
    name: 'Laura Gómez', email: 'laura.gomez@fleetcore.com',
    specialty: 'Frenos y suspensión', isActive: true, user: tech2,
  });
  await findOrCreate(mechanics, { email: 'pedro.ruiz@fleetcore.com' }, {
    name: 'Pedro Ruiz', email: 'pedro.ruiz@fleetcore.com',
    specialty: 'Electricidad', isActive: false, user: null,
  });

  //2 talleres: 1 activo y 1 inactivo
  const norte = await findOrCreate(workshops, { name: 'Taller Norte' }, {
    name: 'Taller Norte', address: 'Calle 85 # 50-20, Barranquilla', isActive: true,
  });
  await findOrCreate(workshops, { name: 'Taller Centro' }, {
    name: 'Taller Centro', address: 'Carrera 44 # 38-10, Barranquilla', isActive: false,
  });

  //4 vehiculos: 2 AVAILABLE, 1 IN_MAINTENANCE y 1 INACTIVE
  const abc = await findOrCreate(vehicles, { plate: 'ABC123' }, {
    plate: 'ABC123', brand: 'Renault', model: 'Twingo', year: 2021,
    mileage: 45100, status: VehicleStatus.AVAILABLE,
  });
  await findOrCreate(vehicles, { plate: 'DEF456' }, {
    plate: 'DEF456', brand: 'Renault', model: 'Duster', year: 2022,
    mileage: 20000, status: VehicleStatus.AVAILABLE,
  });
  const ghi = await findOrCreate(vehicles, { plate: 'GHI789' }, {
    plate: 'GHI789', brand: 'Ferrari', model: 'Purosangue', year: 2020,
    mileage: 80000, status: VehicleStatus.IN_MAINTENANCE,
  });
  await findOrCreate(vehicles, { plate: 'JKL012' }, {
    plate: 'JKL012', brand: 'Ford', model: 'Pinto', year: 2015,
    mileage: 250000, status: VehicleStatus.INACTIVE,
  });

  //1 mantenimiento COMPLETED (historial de ABC123)
  await findOrCreate(
    maintenances,
    { vehicle: { id: abc.id }, status: MaintenanceStatus.COMPLETED },
    {
      type: MaintenanceType.PREVENTIVE,
      description: 'Cambio de aceite y filtros',
      mileage: 45000,
      scheduledStart: new Date('2026-09-15T14:00:00Z'),
      scheduledEnd: new Date('2026-09-15T16:00:00Z'),
      status: MaintenanceStatus.COMPLETED,
      vehicle: abc,
      mechanic: carlos,
      workshop: norte,
      workDone: 'Cambio de aceite y filtros',
      finalCost: 350000,
      finishedAt: new Date('2026-09-15T16:30:00Z'),
      finalMileage: 45100,
    },
  );

  //1 mantenimiento IN_PROGRESS (el vehículo GHI789 está en taller)
  await findOrCreate(
    maintenances,
    { vehicle: { id: ghi.id }, status: MaintenanceStatus.IN_PROGRESS },
    {
      type: MaintenanceType.CORRECTIVE,
      description: 'Reemplazo de pastillas de freno',
      mileage: 80000,
      scheduledStart: new Date('2026-10-27T13:00:00Z'),
      scheduledEnd: new Date('2026-10-27T17:00:00Z'),
      status: MaintenanceStatus.IN_PROGRESS,
      vehicle: ghi,
      mechanic: laura,
      workshop: norte,
    },
  );

  console.log('Seed completado. Admin:', admin.email);
  await app.close();
}

seed().catch((error) => {
  console.error('Error ejecutando el seed:', error);
  process.exit(1);
});