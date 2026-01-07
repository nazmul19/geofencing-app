import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';

@Entity()
export class Geofence {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column("decimal")
    latitude: number;

    @Column("decimal")
    longitude: number;

    @Column("int")
    radius: number;

    @ManyToOne(() => Organization, (org) => org.geofences)
    organization: Organization;

    @Column()
    organizationId: string;
}
