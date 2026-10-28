import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { MaintenancesModule } from './maintenances/maintenances.module';
import { MechanicsModule } from './mechanics/mechanics.module';
import { UsersModule } from './users/users.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { WorkshopsModule } from './workshops/workshops.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DB_HOST'),
        port: Number(config.get('DB_PORT')),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        autoLoadEntities: true, //carga las entidades registradas con forFeature
        synchronize: true, //crea/actualiza las tablas solo (útil en pruebas, no en produccion)
      }),
    }),
    UsersModule,
    AuthModule,
    VehiclesModule,
    MechanicsModule,
    WorkshopsModule,
    MaintenancesModule,
    IntegrationsModule,
  ],
})
export class AppModule {}