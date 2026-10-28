import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { AuthUser } from '../common/auth-user';
import { MechanicsService } from '../mechanics/mechanics.service';
import { Role } from '../users/enums/role.enum';
import { VehicleStatus } from '../vehicles/enums/vehicle-status.enum';
import { VehiclesService } from '../vehicles/vehicles.service';
import { WorkshopsService } from '../workshops/workshops.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceStatusDto } from './dto/update-maintenance-status.dto';
import { Maintenance } from './entities/maintenance.entity';
import { MaintenanceStatus } from './enums/maintenance.enums';

//estados "activos": ocupan al vehículo y al mecánico
const ACTIVE_STATUSES = [MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS];

//mapa de transiciones válidas. Lista vacía = estado final (no se puede salir de él)
const ALLOWED_TRANSITIONS: Record<MaintenanceStatus, MaintenanceStatus[]> = {
  [MaintenanceStatus.SCHEDULED]: [MaintenanceStatus.IN_PROGRESS, MaintenanceStatus.CANCELLED],
  [MaintenanceStatus.IN_PROGRESS]: [MaintenanceStatus.COMPLETED, MaintenanceStatus.CANCELLED],
  [MaintenanceStatus.COMPLETED]: [],
  [MaintenanceStatus.CANCELLED]: [],
};

const BASE_RELATIONS = { vehicle: true, mechanic: true, workshop: true } as const;

@Injectable()
export class MaintenancesService {
  constructor(
    @InjectRepository(Maintenance) private readonly repo: Repository<Maintenance>,
    private readonly dataSource: DataSource,
    private readonly vehiclesService: VehiclesService,
    private readonly mechanicsService: MechanicsService,
    private readonly workshopsService: WorkshopsService,
  ) {}

  // --- CREAR ---
  async create(dto: CreateMaintenanceDto) {
    const start = new Date(dto.scheduledStart);
    const end = new Date(dto.scheduledEnd);
    if (end <= start) {
      throw new BadRequestException('scheduledEnd debe ser posterior a scheduledStart');
    }

    //estos métodos lanzan 404 si el registro no existe
    const vehicle = await this.vehiclesService.findOne(dto.vehicleId);
    const mechanic = await this.mechanicsService.findOne(dto.mechanicId);
    const workshop = await this.workshopsService.findOne(dto.workshopId);

    if (vehicle.status === VehicleStatus.INACTIVE) {
      throw new ConflictException(`El vehículo ${vehicle.plate} está inactivo`);
    }
    if (!mechanic.isActive) {
      throw new ConflictException(`El mecánico ${mechanic.name} está inactivo`);
    }
    if (!workshop.isActive) {
      throw new ConflictException(`El taller ${workshop.name} está inactivo`);
    }
    if (dto.mileage < vehicle.mileage) {
      throw new BadRequestException(
        `El kilometraje (${dto.mileage}) no puede ser menor al actual del vehículo (${vehicle.mileage})`,
      );
    }

    //un vehículo no puede tener más de un mantenimiento activo
    const vehicleBusy = await this.repo.count({
      where: { vehicle: { id: vehicle.id }, status: In(ACTIVE_STATUSES) },
    });
    if (vehicleBusy > 0) {
      throw new ConflictException(`El vehículo ${vehicle.plate} ya tiene un mantenimiento activo`);
    }

    await this.assertMechanicIsFree(mechanic.id, start, end);

    return this.repo.save(
      this.repo.create({
        type: dto.type,
        description: dto.description,
        mileage: dto.mileage,
        scheduledStart: start,
        scheduledEnd: end,
        status: MaintenanceStatus.SCHEDULED, //siempre inicia SCHEDULED
        vehicle,
        mechanic,
        workshop,
      }),
    );
  }

  /*
    regla de cruces: el mecanico no puede tener dos mantenimientos ACTIVOS
    cuyos horarios tengan conflicto, sin importar el taller.
    Se solapan si: inicioExistente < finNuevo  Y  finExistente > inicioNuevo.
    Con desigualdades estrictas, uno que inicia justo cuando otro termina SÍ se permite.
   */
  private async assertMechanicIsFree(mechanicId: number, start: Date, end: Date) {
    const conflict = await this.repo
      .createQueryBuilder('m')
      .innerJoin('m.mechanic', 'mech')
      .where('mech.id = :mechanicId', { mechanicId })
      .andWhere('m.status IN (:...active)', { active: ACTIVE_STATUSES })
      .andWhere('m.scheduledStart < :end AND m.scheduledEnd > :start', { start, end })
      .getOne();

    if (conflict) {
      throw new ConflictException(
        `El mecánico ya tiene el mantenimiento #${conflict.id} activo en ese horario`,
      );
    }
  }

  // --- CONSULTAS ---
  findAll() {
    return this.repo.find({ relations: BASE_RELATIONS, order: { id: 'DESC' } });
  }

  findActive() {
    return this.repo.find({
      where: { status: In(ACTIVE_STATUSES) },
      relations: BASE_RELATIONS,
      order: { scheduledStart: 'ASC' },
    });
  }

  async findByVehicle(vehicleId: number) {
    await this.vehiclesService.findOne(vehicleId); //404 si no existe
    return this.repo.find({
      where: { vehicle: { id: vehicleId } },
      relations: BASE_RELATIONS,
      order: { scheduledStart: 'DESC' },
    });
  }

  //historial = mantenimientos ya COMPLETADOS del vehículo
  async findHistoryByVehicle(vehicleId: number) {
    await this.vehiclesService.findOne(vehicleId);
    return this.repo.find({
      where: { vehicle: { id: vehicleId }, status: MaintenanceStatus.COMPLETED },
      relations: BASE_RELATIONS,
      order: { finishedAt: 'DESC' },
    });
  }

  async findByMechanic(mechanicId: number) {
    await this.mechanicsService.findOne(mechanicId);
    return this.repo.find({
      where: { mechanic: { id: mechanicId } },
      relations: BASE_RELATIONS,
      order: { scheduledStart: 'DESC' },
    });
  }

  //tecnico autenticado: sus mantenimientos, con vehículo y taller
  async findMine(user: AuthUser) {
    const mechanic = await this.mechanicsService.findByUserId(user.id);
    return this.repo.find({
      where: { mechanic: { id: mechanic.id } },
      relations: BASE_RELATIONS,
      order: { scheduledStart: 'ASC' },
    });
  }

  async findOne(id: number, user?: AuthUser) {
    const maintenance = await this.repo.findOne({
      where: { id },
      relations: { vehicle: true, workshop: true, mechanic: { user: true } },
    });
    if (!maintenance) throw new NotFoundException(`Mantenimiento ${id} no encontrado`);

    if (user?.role === Role.TECHNICIAN && maintenance.mechanic.user?.id !== user.id) {
      throw new ForbiddenException('Este mantenimiento no está asignado a ti');
    }
    return maintenance;
  }

  //historial para la integracion externa 
  async getVehicleHistoryByPlate(plate: string) {
    const vehicle = await this.vehiclesService.findByPlate(plate);
    const maintenances = await this.repo.find({
      where: { vehicle: { id: vehicle.id }, status: MaintenanceStatus.COMPLETED },
      relations: { mechanic: true, workshop: true },
      order: { finishedAt: 'DESC' },
    });

    return {
      vehicle: {
        id: vehicle.id,
        plate: vehicle.plate,
        brand: vehicle.brand,
        model: vehicle.model,
        available: vehicle.status === VehicleStatus.AVAILABLE,
      },
      maintenances: maintenances.map((m) => ({
        id: m.id,
        type: m.type,
        status: m.status,
        description: m.description,
        mileage: m.finalMileage,
        cost: m.finalCost,
        finishedAt: m.finishedAt,
        mechanic: { id: m.mechanic.id, name: m.mechanic.name },
        workshop: { id: m.workshop.id, name: m.workshop.name },
      })),
    };
  }

  //--- CAMBIO DE ESTADO ---
  async updateStatus(id: number, dto: UpdateMaintenanceStatusDto, user: AuthUser) {
    /*
      TRANSACCION: el mantenimiento y el vehiculo cambian JUNTOS o no cambia ninguno.
      Si algo lanza una excepción dentro, TypeORM hace rollback automatico.
     */
    return this.dataSource.transaction(async (manager) => {
      const maintenance = await manager.findOne(Maintenance, {
        where: { id },
        relations: { vehicle: true, workshop: true, mechanic: { user: true } },
      });
      if (!maintenance) throw new NotFoundException(`Mantenimiento ${id} no encontrado`);

      //reglas del tecnico: solo los suyos, y no puede cancelar
      if (user.role === Role.TECHNICIAN) {
        if (maintenance.mechanic.user?.id !== user.id) {
          throw new ForbiddenException('Este mantenimiento no está asignado a ti');
        }
        if (dto.status === MaintenanceStatus.CANCELLED) {
          throw new ForbiddenException('Un técnico no puede cancelar mantenimientos');
        }
      }

      //validación de la transicion con mensaje descriptivo
      if (!ALLOWED_TRANSITIONS[maintenance.status].includes(dto.status)) {
        throw new ConflictException(
          `Transición inválida: un mantenimiento ${maintenance.status} no puede pasar a ${dto.status}`,
        );
      }

      const vehicle = maintenance.vehicle;

      switch (dto.status) {
        case MaintenanceStatus.IN_PROGRESS:
          if (vehicle.status === VehicleStatus.INACTIVE) {
            throw new ConflictException(`El vehículo ${vehicle.plate} está inactivo`);
          }
          vehicle.status = VehicleStatus.IN_MAINTENANCE; //el vehiculo entra a taller
          break;

        case MaintenanceStatus.COMPLETED: {
          const required = ['workDone', 'finalCost', 'finishedAt', 'finalMileage'] as const;
          const missing = required.filter((field) => dto[field] === undefined || dto[field] === null);
          if (missing.length > 0) {
            throw new BadRequestException(
              `Para completar el mantenimiento faltan: ${missing.join(', ')}`,
            );
          }
          if (dto.finalMileage! < vehicle.mileage) {
            throw new BadRequestException(
              `El kilometraje final (${dto.finalMileage}) no puede ser menor al del vehículo (${vehicle.mileage})`,
            );
          }
          maintenance.workDone = dto.workDone!;
          maintenance.finalCost = dto.finalCost!;
          maintenance.finishedAt = new Date(dto.finishedAt!);
          maintenance.finalMileage = dto.finalMileage!;

          vehicle.mileage = dto.finalMileage!; //el vehiculo actualiza su kilometraje
          vehicle.status = VehicleStatus.AVAILABLE; //y queda disponible otra vez
          break;
        }

        case MaintenanceStatus.CANCELLED:
          //si ya estaba en taller, al cancelar el vehículo se libera
          if (maintenance.status === MaintenanceStatus.IN_PROGRESS) {
            vehicle.status = VehicleStatus.AVAILABLE;
          }
          break;
      }

      maintenance.status = dto.status;
      await manager.save(vehicle);
      return manager.save(maintenance);
    });
  }
}