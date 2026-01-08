import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CreateRouteAssignmentDto } from './dto/create-route-assignment.dto';
import { UpdateRouteAssignmentDto } from './dto/update-route-assignment.dto';
import { RouteAssignment, RouteAssignmentStatus } from './entities/route-assignment.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class RouteAssignmentsService {
  constructor(
    @InjectRepository(RouteAssignment)
    private assignmentRepository: Repository<RouteAssignment>,
    private notificationsService: NotificationsService,
  ) { }

  async create(createDto: CreateRouteAssignmentDto): Promise<RouteAssignment> {
    // Validate scheduled time and buffer
    if (!createDto.scheduledTime) {
      throw new BadRequestException('Scheduled time is required');
    }

    const assignment = this.assignmentRepository.create({
      ...createDto,
      scheduledTime: new Date(createDto.scheduledTime),
      bufferMinutes: createDto.bufferMinutes || 10,
      status: RouteAssignmentStatus.PLANNED
    });

    return this.assignmentRepository.save(assignment);
  }

  findAll() {
    return this.assignmentRepository.find({
      relations: ['assignedTo', 'reportsTo', 'geofence', 'organization']
    });
  }

  findByOrganization(organizationId: string) {
    return this.assignmentRepository.find({
      where: { organizationId },
      relations: ['assignedTo', 'reportsTo', 'geofence'],
      order: { scheduledTime: 'ASC' }
    });
  }

  findByUser(userId: string) {
    return this.assignmentRepository.find({
      where: { assignedToId: userId },
      relations: ['reportsTo', 'geofence'],
      order: { scheduledTime: 'ASC' }
    });
  }

  findOne(id: string) {
    return this.assignmentRepository.findOne({
      where: { id },
      relations: ['assignedTo', 'reportsTo', 'geofence', 'organization']
    });
  }

  async update(id: string, updateDto: UpdateRouteAssignmentDto) {
    await this.assignmentRepository.update(id, updateDto);
    return this.findOne(id);
  }

  async cancel(id: string, cancelledById: string, reason?: string) {
    const assignment = await this.findOne(id);
    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    if (assignment.status === RouteAssignmentStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed assignment');
    }

    await this.assignmentRepository.update(id, {
      status: RouteAssignmentStatus.CANCELLED,
      statusChangedAt: new Date(),
      cancelledById,
      cancellationReason: reason
    });

    const updated = await this.findOne(id);
    if (!updated) return null;

    // Notify assigned user
    await this.notificationsService.create({
      userId: updated.assignedToId,
      title: 'Assignment Cancelled',
      message: `Your visit to ${updated.geofence?.name} has been cancelled. Reason: ${reason || 'Not specified'}.`,
      type: NotificationType.WARNING,
    });

    // Notify manager if someone else cancelled it
    if (updated.reportsToId && updated.reportsToId !== cancelledById) {
      await this.notificationsService.create({
        userId: updated.reportsToId,
        title: 'Assignment Cancelled',
        message: `The visit to ${updated.geofence?.name} for ${updated.assignedTo?.email} was cancelled.`,
        type: NotificationType.INFO,
      });
    }

    return updated;
  }

  async checkIn(assignmentId: string, latitude: number, longitude: number) {
    const assignment = await this.findOne(assignmentId);
    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    if (assignment.status !== RouteAssignmentStatus.PLANNED) {
      throw new BadRequestException(`Assignment is already ${assignment.status}`);
    }

    // Check if within scheduled window (with buffer)
    const now = new Date();
    const scheduled = new Date(assignment.scheduledTime);
    const bufferMs = assignment.bufferMinutes * 60 * 1000;
    const windowStart = new Date(scheduled.getTime() - bufferMs);
    const windowEnd = new Date(scheduled.getTime() + bufferMs);

    if (now < windowStart || now > windowEnd) {
      throw new BadRequestException('Check-in is outside the scheduled time window');
    }

    // Check if within geofence
    const geofence = assignment.geofence;
    const distance = this.calculateDistance(
      latitude,
      longitude,
      Number(geofence.latitude),
      Number(geofence.longitude)
    );

    if (distance > geofence.radius) {
      throw new BadRequestException(`You are ${Math.round(distance)}m away from the geofence. Must be within ${geofence.radius}m.`);
    }

    // Mark as completed
    await this.assignmentRepository.update(assignmentId, {
      status: RouteAssignmentStatus.COMPLETED,
      actualEntryTime: now,
      entryLatitude: latitude,
      entryLongitude: longitude,
      statusChangedAt: now
    });

    const updated = await this.findOne(assignmentId);
    if (!updated) return null;

    // Notify manager of successful check-in
    if (updated.reportsToId) {
      await this.notificationsService.create({
        userId: updated.reportsToId,
        title: 'Site Visit Completed',
        message: `${updated.assignedTo?.email} successfully checked in at ${updated.geofence?.name}.`,
        type: NotificationType.SUCCESS,
      });
    }

    return updated;
  }

  // Haversine formula to calculate distance in meters
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Background job to mark missed assignments - runs every hour
  @Cron(CronExpression.EVERY_HOUR)
  async handleMissedAssignments() {
    console.log('Running missed assignments check...');

    const now = new Date();

    // Find all PLANNED assignments where scheduledTime + buffer has passed
    const plannedAssignments = await this.assignmentRepository.find({
      where: { status: RouteAssignmentStatus.PLANNED },
      relations: ['geofence', 'assignedTo', 'reportsTo']
    });

    for (const assignment of plannedAssignments) {
      const scheduled = new Date(assignment.scheduledTime);
      const bufferMs = assignment.bufferMinutes * 60 * 1000;
      const windowEnd = new Date(scheduled.getTime() + bufferMs);

      if (now > windowEnd) {
        // Mark as missed
        await this.assignmentRepository.update(assignment.id, {
          status: RouteAssignmentStatus.MISSED,
          statusChangedAt: now
        });

        // Create notification for reportsTo user
        await this.notifyManager(assignment);

        console.log(`Assignment ${assignment.id} marked as MISSED`);
      }
    }
  }

  private async notifyManager(assignment: RouteAssignment) {
    // Create in-app notification for the manager
    if (assignment.reportsToId) {
      await this.notificationsService.create({
        userId: assignment.reportsToId,
        title: 'Site Visit Missed',
        message: `User ${assignment.assignedTo?.email} missed the scheduled visit to ${assignment.geofence?.name}.`,
        type: NotificationType.DANGER,
      });
    }

    // Create in-app notification for the assigned user
    if (assignment.assignedToId) {
      await this.notificationsService.create({
        userId: assignment.assignedToId,
        title: 'You missed a visit',
        message: `You missed your scheduled visit to ${assignment.geofence?.name}. Please contact your supervisor.`,
        type: NotificationType.WARNING,
      });
    }
  }

  remove(id: string) {
    return this.assignmentRepository.delete(id);
  }
}
