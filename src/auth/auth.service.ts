import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    if (await this.usersService.findByEmail(dto.email)) {
      throw new ConflictException('El correo ya está registrado');
    }

    //nunca guardamos la contraseña real
    const hash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      password: hash,
      role: dto.role,
    });

    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    const passwordOk = user ? await bcrypt.compare(dto.password, user.password) : false;

    //mismo mensaje en ambos casos para no revelar si el correo existe
    if (!user || !passwordOk) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    return { accessToken };
  }
}