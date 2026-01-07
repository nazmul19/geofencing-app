import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { GeofencesService } from './geofences.service';
import { CreateGeofenceDto } from './dto/create-geofence.dto';
import { UpdateGeofenceDto } from './dto/update-geofence.dto';

@Controller('geofences')
export class GeofencesController {
  constructor(private readonly geofencesService: GeofencesService) { }

  @Post()
  create(@Body() createGeofenceDto: CreateGeofenceDto) {
    return this.geofencesService.create(createGeofenceDto);
  }

  @Get()
  findAll(@Query('organizationId') organizationId?: string) {
    if (organizationId) {
      return this.geofencesService.findByOrganization(organizationId);
    }
    return this.geofencesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.geofencesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateGeofenceDto: UpdateGeofenceDto) {
    return this.geofencesService.update(id, updateGeofenceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.geofencesService.remove(id);
  }
}
