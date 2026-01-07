import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Geofence } from '../../geofences/entities/geofence.entity';

@Entity()
export class Organization {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    name: string;

    @Column({ unique: true })
    emailDomain: string;

    @Column({ default: 'PENDING' })
    status: string;

    @CreateDateColumn()
    createdAt: Date;

    @Column({ nullable: true })
    approvedAt: Date;

    @OneToMany(() => User, (user) => user.organization)
    users: User[];

    @OneToMany(() => Geofence, (geofence) => geofence.organization)
    geofences: Geofence[];
}
