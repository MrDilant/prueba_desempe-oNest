import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuthUser } from '../common/auth-user';
import { MechanicsService } from '../mechanics/mechanics.service';
import { Role } from '../users/enums/role.enum';
import { VehicleStatus } from '../vehicles/enums/vehicle-status.enum';
import { VehiclesService } from '../vehicles/vehicles.service';
import { WorkshopsService } from '../workshops/workshops.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { Maintenance } from './entities/maintenance.entity';
import { MaintenanceStatus, MaintenanceType } from './enums/maintenance.enums';
import { MaintenancesService } from './maintenances.service';

describe('MaintenancesService', () => {
  let service: MaintenancesService;
  let repo: Record<string, jest.Mock>;
  let manager: { findOne: jest.Mock; save: jest.Mock };
  let queryBuilder: Record<string, jest.Mock>;
  let vehiclesService: Record<string, jest.Mock>;
  let mechanicsService: Record<string, jest.Mock>;
  let workshopsService: Record<string, jest.Mock>;

  //usuarios de prueba
  const admin: AuthUser = { id: 1, email: 'admin@fleetcore.com', role: Role.ADMIN };
  const technician: AuthUser = { id: 10, email: 'tech1@fleetcore.com', role: Role.TECHNICIAN };
  const otherTechnician: AuthUser = { id: 11, email: 'tech2@fleetcore.com', role: Role.TECHNICIAN };

  //mantenimiento falso que pertenece al tecnico con id 10
  const buildMaintenance = (
    status: MaintenanceStatus,
    vehicleStatus: VehicleStatus = VehicleStatus.AVAILABLE,
  ) =>
    ({
      id: 1,
      status,
      scheduledStart: new Date('2026-11-02T13:00:00Z'),
      vehicle: { id: 1, plate: 'ABC123', mileage: 1000, status: vehicleStatus },
      mechanic: { id: 1, name: 'Carlos Pérez', user: { id: 10 } },
      workshop: { id: 1, name: 'Taller Norte' },
    }) as unknown as Maintenance;

  beforeEach(async () => {
    //queryBuilder falso: cada metodo devuelve el mismo objeto (encadenable) y getOne = "no hay cruce"
    queryBuilder = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };

    repo = {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn((data: unknown) => data),
      save: jest.fn(async (data: unknown) => data),
      find: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };

    // "manager" falso: guardar devuelve la misma entidad que recibe
    manager = {
      findOne: jest.fn(),
      save: jest.fn(async (entity: unknown) => entity),
    };

    //la transaccion falsa simplemente ejecuta la funcion que le pasan con nuestro manager
    const dataSource = {
      transaction: jest.fn(async (callback: (m: unknown) => unknown) => callback(manager)),
    };

    //por defecto, vehiculo, mecanico y taller existen y estan activos
    vehiclesService = {
      findOne: jest
        .fn()
        .mockResolvedValue({ id: 1, plate: 'ABC123', mileage: 1000, status: VehicleStatus.AVAILABLE }),
      findByPlate: jest.fn(),
    };
    mechanicsService = {
      findOne: jest.fn().mockResolvedValue({ id: 1, name: 'Carlos Pérez', isActive: true }),
      findByUserId: jest.fn(),
    };
    workshopsService = {
      findOne: jest.fn().mockResolvedValue({ id: 1, name: 'Taller Norte', isActive: true }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        MaintenancesService,
        { provide: getRepositoryToken(Maintenance), useValue: repo },
        { provide: DataSource, useValue: dataSource },
        { provide: VehiclesService, useValue: vehiclesService },
        { provide: MechanicsService, useValue: mechanicsService },
        { provide: WorkshopsService, useValue: workshopsService },
      ],
    }).compile();

    service = moduleRef.get(MaintenancesService);
  });

  //--- CAMBIO DE ESTADO ---
  describe('updateStatus', () => {
    it('SCHEDULED -> IN_PROGRESS pone el vehículo en IN_MAINTENANCE', async () => {
      manager.findOne.mockResolvedValue(buildMaintenance(MaintenanceStatus.SCHEDULED));

      const result = await service.updateStatus(1, { status: MaintenanceStatus.IN_PROGRESS }, admin);

      expect(result.status).toBe(MaintenanceStatus.IN_PROGRESS);
      expect(result.vehicle.status).toBe(VehicleStatus.IN_MAINTENANCE);
      expect(manager.save).toHaveBeenCalledTimes(2); // vehículo + mantenimiento
    });

    it('IN_PROGRESS -> COMPLETED deja el vehículo AVAILABLE y actualiza su kilometraje', async () => {
      manager.findOne.mockResolvedValue(
        buildMaintenance(MaintenanceStatus.IN_PROGRESS, VehicleStatus.IN_MAINTENANCE),
      );

      const result = await service.updateStatus(
        1,
        {
          status: MaintenanceStatus.COMPLETED,
          workDone: 'Cambio de aceite y filtros',
          finalCost: 350000,
          finishedAt: '2026-11-02T16:30:00Z',
          finalMileage: 1200,
        },
        admin,
      );

      expect(result.status).toBe(MaintenanceStatus.COMPLETED);
      expect(result.workDone).toBe('Cambio de aceite y filtros');
      expect(result.finalCost).toBe(350000);
      expect(result.vehicle.status).toBe(VehicleStatus.AVAILABLE);
      expect(result.vehicle.mileage).toBe(1200);
    });

    it('rechaza COMPLETED si faltan los datos de cierre (400)', async () => {
      manager.findOne.mockResolvedValue(
        buildMaintenance(MaintenanceStatus.IN_PROGRESS, VehicleStatus.IN_MAINTENANCE),
      );

      const promise = service.updateStatus(1, { status: MaintenanceStatus.COMPLETED }, admin);

      await expect(promise).rejects.toThrow(BadRequestException);
      await expect(promise).rejects.toThrow('workDone');
      expect(manager.save).not.toHaveBeenCalled();
    });

    it('rechaza COMPLETED si el kilometraje final es menor al del vehículo (400)', async () => {
      manager.findOne.mockResolvedValue(
        buildMaintenance(MaintenanceStatus.IN_PROGRESS, VehicleStatus.IN_MAINTENANCE),
      );

      await expect(
        service.updateStatus(
          1,
          {
            status: MaintenanceStatus.COMPLETED,
            workDone: 'Trabajo',
            finalCost: 100,
            finishedAt: '2026-11-02T16:30:00Z',
            finalMileage: 900, //el vehículo tiene 1000
          },
          admin,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza saltar estados: SCHEDULED -> COMPLETED (409) y no guarda nada', async () => {
      manager.findOne.mockResolvedValue(buildMaintenance(MaintenanceStatus.SCHEDULED));

      await expect(
        service.updateStatus(1, { status: MaintenanceStatus.COMPLETED }, admin),
      ).rejects.toThrow(ConflictException);
      expect(manager.save).not.toHaveBeenCalled();
    });

    it('un mantenimiento COMPLETED no puede volver a un estado anterior (409)', async () => {
      manager.findOne.mockResolvedValue(buildMaintenance(MaintenanceStatus.COMPLETED));

      await expect(
        service.updateStatus(1, { status: MaintenanceStatus.IN_PROGRESS }, admin),
      ).rejects.toThrow(ConflictException);
    });

    it('un mantenimiento CANCELLED no puede pasar a IN_PROGRESS ni COMPLETED (409)', async () => {
      manager.findOne.mockResolvedValue(buildMaintenance(MaintenanceStatus.CANCELLED));

      await expect(
        service.updateStatus(1, { status: MaintenanceStatus.IN_PROGRESS }, admin),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.updateStatus(1, { status: MaintenanceStatus.COMPLETED }, admin),
      ).rejects.toThrow(ConflictException);
    });

    it('cancelar un mantenimiento IN_PROGRESS libera el vehículo', async () => {
      manager.findOne.mockResolvedValue(
        buildMaintenance(MaintenanceStatus.IN_PROGRESS, VehicleStatus.IN_MAINTENANCE),
      );

      const result = await service.updateStatus(1, { status: MaintenanceStatus.CANCELLED }, admin);

      expect(result.status).toBe(MaintenanceStatus.CANCELLED);
      expect(result.vehicle.status).toBe(VehicleStatus.AVAILABLE);
    });

    it('cancelar un mantenimiento SCHEDULED no cambia el estado del vehículo', async () => {
      manager.findOne.mockResolvedValue(buildMaintenance(MaintenanceStatus.SCHEDULED));

      const result = await service.updateStatus(1, { status: MaintenanceStatus.CANCELLED }, admin);

      expect(result.vehicle.status).toBe(VehicleStatus.AVAILABLE);
    });

    it('el técnico dueño puede iniciar su mantenimiento', async () => {
      manager.findOne.mockResolvedValue(buildMaintenance(MaintenanceStatus.SCHEDULED));

      const result = await service.updateStatus(
        1,
        { status: MaintenanceStatus.IN_PROGRESS },
        technician,
      );

      expect(result.status).toBe(MaintenanceStatus.IN_PROGRESS);
    });

    it('un técnico NO puede cancelar mantenimientos (403)', async () => {
      manager.findOne.mockResolvedValue(buildMaintenance(MaintenanceStatus.SCHEDULED));

      await expect(
        service.updateStatus(1, { status: MaintenanceStatus.CANCELLED }, technician),
      ).rejects.toThrow(ForbiddenException);
    });

    it('un técnico NO puede cambiar el estado de un mantenimiento ajeno (403)', async () => {
      manager.findOne.mockResolvedValue(buildMaintenance(MaintenanceStatus.SCHEDULED));

      await expect(
        service.updateStatus(1, { status: MaintenanceStatus.IN_PROGRESS }, otherTechnician),
      ).rejects.toThrow(ForbiddenException);
    });

    it('responde 404 si el mantenimiento no existe', async () => {
      manager.findOne.mockResolvedValue(null);

      await expect(
        service.updateStatus(99, { status: MaintenanceStatus.IN_PROGRESS }, admin),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // --- CREAR ---
  describe('create', () => {
    const dto: CreateMaintenanceDto = {
      type: MaintenanceType.PREVENTIVE,
      description: 'Cambio de aceite',
      mileage: 1000,
      scheduledStart: '2026-11-02T13:00:00Z',
      scheduledEnd: '2026-11-02T14:30:00Z',
      vehicleId: 1,
      mechanicId: 1,
      workshopId: 1,
    };

    it('crea el mantenimiento con estado SCHEDULED', async () => {
      const result = await service.create(dto);

      expect(result.status).toBe(MaintenanceStatus.SCHEDULED);
      expect(repo.save).toHaveBeenCalledTimes(1);
    });

    it('la consulta de cruces usa desigualdades estrictas (permite 7:30-9:00 y 9:00-10:00)', async () => {
      await service.create(dto);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'm.scheduledStart < :end AND m.scheduledEnd > :start',
        expect.anything(),
      );
    });

    it('rechaza si la fecha de fin no es posterior a la de inicio (400)', async () => {
      await expect(
        service.create({ ...dto, scheduledEnd: dto.scheduledStart }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza un vehículo INACTIVE (409)', async () => {
      vehiclesService.findOne.mockResolvedValue({
        id: 1, plate: 'JKL012', mileage: 1000, status: VehicleStatus.INACTIVE,
      });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('rechaza un mecánico inactivo (409)', async () => {
      mechanicsService.findOne.mockResolvedValue({ id: 3, name: 'Pedro Ruiz', isActive: false });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('rechaza un taller inactivo (409)', async () => {
      workshopsService.findOne.mockResolvedValue({ id: 2, name: 'Taller Centro', isActive: false });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('rechaza un kilometraje menor al actual del vehículo (400)', async () => {
      await expect(service.create({ ...dto, mileage: 500 })).rejects.toThrow(BadRequestException);
    });

    it('rechaza si el vehículo ya tiene un mantenimiento activo (409)', async () => {
      repo.count.mockResolvedValue(1);

      await expect(service.create(dto)).rejects.toThrow('ya tiene un mantenimiento activo');
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('rechaza si el mecánico tiene un mantenimiento activo que se cruza (409)', async () => {
      queryBuilder.getOne.mockResolvedValue({ id: 7 });

      const promise = service.create(dto);

      await expect(promise).rejects.toThrow(ConflictException);
      await expect(promise).rejects.toThrow('#7');
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  //--- CONSULTAS ---
  describe('findOne', () => {
    it('un técnico puede ver su propio mantenimiento', async () => {
      repo.findOne.mockResolvedValue(buildMaintenance(MaintenanceStatus.SCHEDULED));

      await expect(service.findOne(1, technician)).resolves.toBeDefined();
    });

    it('un técnico NO puede ver un mantenimiento ajeno (403)', async () => {
      repo.findOne.mockResolvedValue(buildMaintenance(MaintenanceStatus.SCHEDULED));

      await expect(service.findOne(1, otherTechnician)).rejects.toThrow(ForbiddenException);
    });

    it('responde 404 si no existe', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findOne(99, admin)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getVehicleHistoryByPlate', () => {
    it('devuelve el vehículo y solo el resumen de sus mantenimientos completados', async () => {
      vehiclesService.findByPlate.mockResolvedValue({
        id: 1, plate: 'ABC123', brand: 'Chevrolet', model: 'NPR', status: VehicleStatus.AVAILABLE,
      });
      repo.find.mockResolvedValue([
        {
          id: 12,
          type: MaintenanceType.PREVENTIVE,
          status: MaintenanceStatus.COMPLETED,
          description: 'Cambio de aceite y filtros',
          finalMileage: 45100,
          finalCost: 350000,
          finishedAt: new Date('2026-09-15T16:30:00Z'),
          mechanic: { id: 3, name: 'Carlos Pérez' },
          workshop: { id: 2, name: 'Taller Norte' },
        },
      ]);

      const result = await service.getVehicleHistoryByPlate('ABC123');

      expect(result.vehicle).toMatchObject({ plate: 'ABC123', available: true });
      expect(result.maintenances).toHaveLength(1);
      expect(result.maintenances[0]).toMatchObject({
        id: 12,
        cost: 350000,
        mileage: 45100,
        mechanic: { id: 3, name: 'Carlos Pérez' },
        workshop: { id: 2, name: 'Taller Norte' },
      });
    });
  });
});