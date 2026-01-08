import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RouteAssignmentsService } from './route-assignments.service';
import { RouteAssignmentsController } from './route-assignments.controller';
import { RouteAssignment } from './entities/route-assignment.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RouteAssignment]),
    NotificationsModule
  ],
  controllers: [RouteAssignmentsController],
  providers: [RouteAssignmentsService],
  exports: [RouteAssignmentsService]
})
export class RouteAssignmentsModule { }
