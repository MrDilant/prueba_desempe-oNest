import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../users/enums/role.enum';
import { UsersService } from '../users/users.service';
import { CreateMechanicDto } from './dto/create-mechanic.dto';
import { UpdateMechanicDto } from './dto/update-mechanic.dto';
import { Mechanic } from './entities/mechanic.entity';

@Injectable()
export class MechanicsService {
  constructor(
    @InjectRepository(Mechanic) private readonly repo: Repository<Mechanic>,
    private readonly usersService: UsersService,
  ) {}

  async create(dto: CreateMechanicDto) {
    let user = null;
    if (dto.userId) {
      user = await this.usersService.findById(dto.userId);
      if (!user) throw new NotFoundException(`Usuario ${dto.userId} no encontrado`);
      if (user.role !== Role.TECHNICIAN) {
        throw new BadRequestException('El usuario vinculado debe tener rol TECHNICIAN');
      }
    }
    return this.repo.save(
      this.repo.create({
        name: dto.name,
        email: dto.email,
        specialty: dto.specialty,
        isActive: true,
        user,
      }),
    );
  }

  findAll() {
    return this.repo.find({ relations: { user: true }, order: { id: 'ASC' } });
  }

  async findOne(id: number) {
    const mechanic = await this.repo.findOne({ where: { id }, relations: { user: true } });
    if (!mechanic) throw new NotFoundException(`Mecánico ${id} no encontrado`);
    return mechanic;
  }

  //para el tecnico autenticado
  async findByUserId(userId: number) {
    const mechanic = await this.repo.findOne({ where: { user: { id: userId } } });
    if (!mechanic) throw new NotFoundException('Tu usuario no tiene un mecánico vinculado');
    return mechanic;
  }

  async update(id: number, dto: UpdateMechanicDto) {
    const mechanic = await this.findOne(id);
    return this.repo.save(Object.assign(mechanic, dto));
  }

  //activar/inactivar no borra nada: el historial de mantenimientos queda intacto
  async setActive(id: number, isActive: boolean) {
    const mechanic = await this.findOne(id);
    mechanic.isActive = isActive;
    return this.repo.save(mechanic);
  }
}