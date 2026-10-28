import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { SetActiveDto } from '../common/dto/set-active.dto';
import { Role } from '../users/enums/role.enum';
import { CreateWorkshopDto } from './dto/create-workshop.dto';
import { UpdateWorkshopDto } from './dto/update-workshop.dto';
import { WorkshopsService } from './workshops.service';

@ApiTags('Workshops')
@ApiBearerAuth()
@Controller('workshops')
export class WorkshopsController {
  constructor(private readonly workshopsService: WorkshopsService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateWorkshopDto) {
    return this.workshopsService.create(dto);
  }

  //cualquier usuario autenticado: solo talleres activos
  @Get()
  findActive() {
    return this.workshopsService.findActive();
  }

  //va antes de ':id'. Para el admin: activos e inactivos
  @Get('all')
  @Roles(Role.ADMIN)
  findAll() {
    return this.workshopsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.workshopsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateWorkshopDto) {
    return this.workshopsService.update(id, dto);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  setActive(@Param('id', ParseIntPipe) id: number, @Body() dto: SetActiveDto) {
    return this.workshopsService.setActive(id, dto.isActive);
  }
}