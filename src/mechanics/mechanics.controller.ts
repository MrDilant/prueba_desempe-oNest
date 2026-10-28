import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { SetActiveDto } from '../common/dto/set-active.dto';
import { Role } from '../users/enums/role.enum';
import { CreateMechanicDto } from './dto/create-mechanic.dto';
import { UpdateMechanicDto } from './dto/update-mechanic.dto';
import { MechanicsService } from './mechanics.service';

@ApiTags('Mechanics')
@ApiBearerAuth()
@Controller('mechanics')
export class MechanicsController {
  constructor(private readonly mechanicsService: MechanicsService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateMechanicDto) {
    return this.mechanicsService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.mechanicsService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.mechanicsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMechanicDto) {
    return this.mechanicsService.update(id, dto);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  setActive(@Param('id', ParseIntPipe) id: number, @Body() dto: SetActiveDto) {
    return this.mechanicsService.setActive(id, dto.isActive);
  }
}