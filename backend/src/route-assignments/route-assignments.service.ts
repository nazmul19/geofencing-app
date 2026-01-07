import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CreateRouteAssignmentDto } from './dto/create-route-assignment.dto';
import { UpdateRouteAssignmentDto } from './dto/update-route-assignment.dto';
import { RouteAssignment, RouteAssignmentStatus } from './entities/route-assignment.entity';

@Injectable()
export class RouteAssignmentsService {
  constructor(
    @InjectRepository(RouteAssignment)
    private assignmentRepository: Repository<RouteAssignment>,
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

    return this.findOne(id);
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

    return this.findOne(assignmentId);
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
    // In a real app, this would send email/push notification
    // For now, we log it and could store in a notifications table
    console.log(`NOTIFICATION: Route assignment missed!`);
    console.log(`  - Assigned User: ${assignment.assignedTo?.email}`);
    console.log(`  - Reports To: ${assignment.reportsTo?.email}`);
    console.log(`  - Geofence: ${assignment.geofence?.name}`);
    console.log(`  - Scheduled Time: ${assignment.scheduledTime}`);
    console.log(`  - Reason: User did not check in within the time window`);

    // TODO: Implement actual notification (email, push, in-app)
    // This could be: 
    // - Email via nodemailer
    // - Push notification via Firebase
    // - In-app notification stored in a Notification entity
  }

  remove(id: string) {
    return this.assignmentRepository.delete(id);
  }
}
