import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Geofence } from '../../geofences/entities/geofence.entity';
import { Organization } from '../../organizations/entities/organization.entity';

export enum RouteAssignmentStatus {
    PLANNED = 'PLANNED',
    COMPLETED = 'COMPLETED',
    MISSED = 'MISSED',
    CANCELLED = 'CANCELLED'
}

@Entity()
export class RouteAssignment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User)
    assignedTo: User;

    @Column()
    assignedToId: string;

    @ManyToOne(() => User)
    reportsTo: User;

    @Column()
    reportsToId: string;

    @ManyToOne(() => Geofence)
    geofence: Geofence;

    @Column()
    geofenceId: string;

    @ManyToOne(() => Organization)
    organization: Organization;

    @Column()
    organizationId: string;

    @Column({ type: 'timestamp' })
    scheduledTime: Date;

    @Column({ default: 10 })
    bufferMinutes: number;

    @Column({
        type: 'varchar',
        default: RouteAssignmentStatus.PLANNED
    })
    status: RouteAssignmentStatus;

    @Column({ type: 'timestamp', nullable: true })
    actualEntryTime: Date;

    @Column({ type: 'decimal', nullable: true })
    entryLatitude: number;

    @Column({ type: 'decimal', nullable: true })
    entryLongitude: number;

    @Column({ type: 'timestamp', nullable: true })
    statusChangedAt: Date;

    @Column({ nullable: true })
    cancellationReason: string;

    @Column({ nullable: true })
    cancelledById: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
