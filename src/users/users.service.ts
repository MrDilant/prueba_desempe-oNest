import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
    constructor(@InjectRepository(User) private readonly repo: Repository<User>) {}

    findById(id: number) {
        return this.repo.findOne({ where: { id } });
    }

    findByEmail(email: string) {
        return this.repo.findOne({ where: { email }});
    }

    //aquí si se pide la contraseña porque el login necesita compararla
    findByEmailWithPassword(email: string) {
        return this.repo.findOne({ 
            where: { email },
            select: { id: true, name: true, email: true, role: true, password: true },
        });
    }

    create(data: Partial<User>) {
        return this.repo.save(this.repo.create(data));
    }
}
