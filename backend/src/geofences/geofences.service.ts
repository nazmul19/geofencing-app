import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CreateGeofenceDto } from './dto/create-geofence.dto';
import { UpdateGeofenceDto } from './dto/update-geofence.dto';
import { Geofence } from './entities/geofence.entity';

@Injectable()
export class GeofencesService {
  constructor(
    @InjectRepository(Geofence)
    private geofenceRepository: Repository<Geofence>,
  ) { }

  create(createGeofenceDto: CreateGeofenceDto) {
    const geofence = this.geofenceRepository.create(createGeofenceDto);
    return this.geofenceRepository.save(geofence);
  }

  findAll() {
    return this.geofenceRepository.find();
  }

  findByOrganization(organizationId: string) {
    return this.geofenceRepository.find({ where: { organizationId } });
  }

  findByIds(ids: string[]) {
    return this.geofenceRepository.find({ where: { id: In(ids) } });
  }

  findOne(id: string) {
    return this.geofenceRepository.findOneBy({ id });
  }

  update(id: string, updateGeofenceDto: UpdateGeofenceDto) {
    return this.geofenceRepository.update(id, updateGeofenceDto);
  }

  remove(id: string) {
    return this.geofenceRepository.delete(id);
  }
}
