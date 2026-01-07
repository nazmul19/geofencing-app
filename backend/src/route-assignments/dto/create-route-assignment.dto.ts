import { IsNotEmpty, IsDateString, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateRouteAssignmentDto {
    @IsUUID()
    @IsNotEmpty()
    assignedToId: string;

    @IsUUID()
    @IsNotEmpty()
    reportsToId: string;

    @IsUUID()
    @IsNotEmpty()
    geofenceId: string;

    @IsUUID()
    @IsNotEmpty()
    organizationId: string;

    @IsDateString()
    @IsNotEmpty()
    scheduledTime: string;

    @IsNumber()
    @Min(1)
    @IsOptional()
    bufferMinutes?: number;
}
