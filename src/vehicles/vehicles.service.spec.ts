import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { VehicleStatus } from './enums/vehicle-status.enum';
import { VehiclesService } from './vehicles.service';

describe('VehiclesService', () => {
  let service: VehiclesService;
  let repo: Record<string, jest.Mock>;

  beforeEach(async () => {
    repo = {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn((data: unknown) => data),
      save: jest.fn(async (data: unknown) => data),
      findOne: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [VehiclesService, { provide: getRepositoryToken(Vehicle), useValue: repo }],
    }).compile();

    service = moduleRef.get(VehiclesService);
  });

  it('crea el vehículo siempre como AVAILABLE', async () => {
    const result = await service.create({
      plate: 'XYZ987', brand: 'Renault', model: 'Duster', year: 2022, mileage: 1000,
    });

    expect(result.status).toBe(VehicleStatus.AVAILABLE);
  });

  it('rechaza una placa duplicada (409) y no guarda', async () => {
    repo.count.mockResolvedValue(1);

    await expect(
      service.create({ plate: 'ABC123', brand: 'X', model: 'Y', year: 2020, mileage: 0 }),
    ).rejects.toThrow(ConflictException);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('findOne responde 404 si no existe', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
  });

  it('findByPlate normaliza la placa (espacios y mayúsculas)', async () => {
    repo.findOne.mockResolvedValue({ id: 1, plate: 'ABC123' });

    await service.findByPlate('  abc123 ');

    expect(repo.findOne).toHaveBeenCalledWith({ where: { plate: 'ABC123' } });
  });

  it('no permite inactivar un vehículo que está en mantenimiento (409)', async () => {
    repo.findOne.mockResolvedValue({ id: 1, status: VehicleStatus.IN_MAINTENANCE });

    await expect(service.inactivate(1)).rejects.toThrow(ConflictException);
  });

  it('inactivar es lógico: el vehículo pasa a INACTIVE y se guarda', async () => {
    repo.findOne.mockResolvedValue({ id: 1, status: VehicleStatus.AVAILABLE });

    const result = await service.inactivate(1);

    expect(result.status).toBe(VehicleStatus.INACTIVE);
    expect(repo.save).toHaveBeenCalled();
  });

  it('activar un vehículo que no está INACTIVE da 409', async () => {
    repo.findOne.mockResolvedValue({ id: 1, status: VehicleStatus.AVAILABLE });

    await expect(service.activate(1)).rejects.toThrow(ConflictException);
  });

  it('activar un vehículo INACTIVE lo deja AVAILABLE', async () => {
    repo.findOne.mockResolvedValue({ id: 1, status: VehicleStatus.INACTIVE });

    const result = await service.activate(1);

    expect(result.status).toBe(VehicleStatus.AVAILABLE);
  });
});