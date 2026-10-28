import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { Vehicle } from './entities/vehicle.entity';
import { VehicleStatus } from './enums/vehicle-status.enum';

@Injectable()
export class VehiclesService {
  constructor(@InjectRepository(Vehicle) private readonly repo: Repository<Vehicle>) {}

  async create(dto: CreateVehicleDto) {
    if ((await this.repo.count({ where: { plate: dto.plate } })) > 0) {
      throw new ConflictException(`Ya existe un vehículo con la placa ${dto.plate}`);
    }
    return this.repo.save(this.repo.create({ ...dto, status: VehicleStatus.AVAILABLE }));
  }

  findAll() {
    return this.repo.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number) {
    const vehicle = await this.repo.findOne({ where: { id } });
    if (!vehicle) throw new NotFoundException(`Vehículo ${id} no encontrado`);
    return vehicle;
  }

  async findByPlate(plate: string) {
    const vehicle = await this.repo.findOne({ where: { plate: plate.trim().toUpperCase() } });
    if (!vehicle) throw new NotFoundException(`Vehículo con placa ${plate} no encontrado`);
    return vehicle;
  }

  async update(id: number, dto: UpdateVehicleDto) {
    const vehicle = await this.findOne(id);
    return this.repo.save(Object.assign(vehicle, dto));
  }

  //eliminacion logica: el vehiculo no se borra, solo pasa a INACTIVE (el historial se conserva)
  async inactivate(id: number) {
    const vehicle = await this.findOne(id);
    if (vehicle.status === VehicleStatus.IN_MAINTENANCE) {
      throw new ConflictException('No se puede inactivar un vehículo que está en mantenimiento');
    }
    vehicle.status = VehicleStatus.INACTIVE;
    return this.repo.save(vehicle);
  }

  async activate(id: number) {
    const vehicle = await this.findOne(id);
    if (vehicle.status !== VehicleStatus.INACTIVE) {
      throw new ConflictException('El vehículo ya está activo');
    }
    vehicle.status = VehicleStatus.AVAILABLE;
    return this.repo.save(vehicle);
  }
}