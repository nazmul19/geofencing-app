import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrganizationsModule } from './organizations/organizations.module';
import { UsersModule } from './users/users.module';
import { GeofencesModule } from './geofences/geofences.module';
import { User } from './users/entities/user.entity';
import { Organization } from './organizations/entities/organization.entity';
import { Geofence } from './geofences/entities/geofence.entity';
import { Route } from './routes/entities/route.entity';
import { RouteAssignment } from './route-assignments/entities/route-assignment.entity';
import { Notification } from './notifications/entities/notification.entity';
import { AuthModule } from './auth/auth.module';

import { SeedService } from './seed.provider';
import { RoutesModule } from './routes/routes.module';
import { RouteAssignmentsModule } from './route-assignments/route-assignments.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
      username: process.env.POSTGRES_USER || 'user',
      password: process.env.POSTGRES_PASSWORD || 'password',
      database: process.env.POSTGRES_DB || 'geofencing_db',
      entities: [User, Organization, Geofence, Route, RouteAssignment, Notification],
      synchronize: true,
    }),
    OrganizationsModule,
    UsersModule,
    GeofencesModule,
    AuthModule,
    RoutesModule,
    RouteAssignmentsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService, SeedService],
})
export class AppModule { }
