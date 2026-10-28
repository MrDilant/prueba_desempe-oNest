import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateWorkshopDto } from './dto/create-workshop.dto';
import { UpdateWorkshopDto } from './dto/update-workshop.dto';
import { Workshop } from './entities/workshop.entity';

@Injectable()
export class WorkshopsService {
  constructor(@InjectRepository(Workshop) private readonly repo: Repository<Workshop>) {}

  create(dto: CreateWorkshopDto) {
    return this.repo.save(this.repo.create({ ...dto, isActive: true }));
  }

  //endpoint que lista solo los talleres ACTIVOS
  findActive() {
    return this.repo.find({ where: { isActive: true }, order: { id: 'ASC' } });
  }

  findAll() {
    return this.repo.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number) {
    const workshop = await this.repo.findOne({ where: { id } });
    if (!workshop) throw new NotFoundException(`Taller ${id} no encontrado`);
    return workshop;
  }

  async update(id: number, dto: UpdateWorkshopDto) {
    const workshop = await this.findOne(id);
    return this.repo.save(Object.assign(workshop, dto));
  }

  async setActive(id: number, isActive: boolean) {
    const workshop = await this.findOne(id);
    workshop.isActive = isActive;
    return this.repo.save(workshop);
  }
}