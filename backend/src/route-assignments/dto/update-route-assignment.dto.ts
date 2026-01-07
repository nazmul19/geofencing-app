import { PartialType } from '@nestjs/mapped-types';
import { CreateRouteAssignmentDto } from './create-route-assignment.dto';

export class UpdateRouteAssignmentDto extends PartialType(CreateRouteAssignmentDto) {}
