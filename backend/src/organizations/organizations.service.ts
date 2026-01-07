import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { Organization } from './entities/organization.entity';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private orgRepository: Repository<Organization>,
  ) { }

  async create(createOrganizationDto: CreateOrganizationDto): Promise<Organization> {
    const org = this.orgRepository.create(createOrganizationDto);
    return this.orgRepository.save(org);
  }

  findAll() {
    return this.orgRepository.find();
  }

  findByStatus(status: string) {
    return this.orgRepository.find({
      where: { status },
      order: { createdAt: 'ASC' } // First come, first serve
    });
  }

  findOne(id: string) {
    return this.orgRepository.findOneBy({ id });
  }

  findByDomain(domain: string) {
    return this.orgRepository.findOneBy({ emailDomain: domain });
  }

  async update(id: string, updateOrganizationDto: UpdateOrganizationDto) {
    await this.orgRepository.update(id, updateOrganizationDto);
    return this.findOne(id);
  }

  async updateStatus(id: string, status: string) {
    await this.orgRepository.update(id, {
      status,
      approvedAt: status === 'ACTIVE' ? new Date() : undefined
    });
    return this.findOne(id);
  }

  remove(id: string) {
    return this.orgRepository.delete(id);
  }
}
