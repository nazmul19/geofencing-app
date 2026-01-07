import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable } from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { Geofence } from '../../geofences/entities/geofence.entity';

@Entity()
export class Route {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @ManyToOne(() => Organization)
    organization: Organization;

    @Column()
    organizationId: string;

    @ManyToMany(() => Geofence)
    @JoinTable()
    geofences: Geofence[];

    @Column({ type: 'timestamp', nullable: true })
    expectedTime: Date;

    @Column({ default: 'PLANNED' })
    status: string; // PLANNED, ACTIVE, COMPLETED
}
