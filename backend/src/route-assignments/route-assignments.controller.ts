import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { RouteAssignmentsService } from './route-assignments.service';
import { CreateRouteAssignmentDto } from './dto/create-route-assignment.dto';
import { UpdateRouteAssignmentDto } from './dto/update-route-assignment.dto';
import { CheckInDto, CancelAssignmentDto } from './dto/check-in.dto';

@Controller('route-assignments')
export class RouteAssignmentsController {
  constructor(private readonly routeAssignmentsService: RouteAssignmentsService) { }

  @Post()
  create(@Body() createRouteAssignmentDto: CreateRouteAssignmentDto) {
    return this.routeAssignmentsService.create(createRouteAssignmentDto);
  }

  @Get()
  findAll(
    @Query('organizationId') organizationId?: string,
    @Query('userId') userId?: string
  ) {
    if (userId) {
      return this.routeAssignmentsService.findByUser(userId);
    }
    if (organizationId) {
      return this.routeAssignmentsService.findByOrganization(organizationId);
    }
    return this.routeAssignmentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.routeAssignmentsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRouteAssignmentDto: UpdateRouteAssignmentDto) {
    return this.routeAssignmentsService.update(id, updateRouteAssignmentDto);
  }

  @Post(':id/check-in')
  checkIn(
    @Param('id') id: string,
    @Body() checkInDto: { latitude: number; longitude: number }
  ) {
    return this.routeAssignmentsService.checkIn(id, checkInDto.latitude, checkInDto.longitude);
  }

  @Post(':id/cancel')
  cancel(
    @Param('id') id: string,
    @Body() cancelDto: CancelAssignmentDto & { cancelledById: string }
  ) {
    return this.routeAssignmentsService.cancel(id, cancelDto.cancelledById, cancelDto.reason);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.routeAssignmentsService.remove(id);
  }
}
