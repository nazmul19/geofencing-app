import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { Route } from './entities/route.entity';
import { GeofencesService } from '../geofences/geofences.service';

@Injectable()
export class RoutesService {
  constructor(
    @InjectRepository(Route)
    private routeRepository: Repository<Route>,
    private geofencesService: GeofencesService,
  ) { }

  async create(createRouteDto: CreateRouteDto) {
    const { geofenceIds, ...rest } = createRouteDto;

    const route = this.routeRepository.create(rest);

    if (geofenceIds && geofenceIds.length > 0) {
      const geofences = await this.geofencesService.findByIds(geofenceIds);
      route.geofences = geofences;
    }

    return this.routeRepository.save(route);
  }

  findAll() {
    return this.routeRepository.find({ relations: ['geofences', 'organization'] });
  }

  findByOrganization(organizationId: string) {
    return this.routeRepository.find({
      where: { organizationId },
      relations: ['geofences', 'organization']
    });
  }

  findOne(id: string) {
    return this.routeRepository.findOne({
      where: { id },
      relations: ['geofences', 'organization']
    });
  }

  async update(id: string, updateRouteDto: UpdateRouteDto) {
    const { geofenceIds, ...rest } = updateRouteDto;

    await this.routeRepository.update(id, rest);

    if (geofenceIds) {
      const route = await this.findOne(id);
      if (route) {
        const geofences = await this.geofencesService.findByIds(geofenceIds);
        route.geofences = geofences;
        await this.routeRepository.save(route);
      }
    }

    return this.findOne(id);
  }

  remove(id: string) {
    return this.routeRepository.delete(id);
  }
}
