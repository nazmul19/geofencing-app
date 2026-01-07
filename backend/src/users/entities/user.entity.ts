import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @Column({ default: 'END_USER' })
    role: string;

    @ManyToOne(() => Organization, (org) => org.users)
    organization: Organization;

    @Column({ nullable: true })
    organizationId: string;
}
