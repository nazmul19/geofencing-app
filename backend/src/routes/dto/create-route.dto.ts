import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

export class CreateRouteDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    organizationId: string;

    @IsArray()
    geofenceIds: string[];

    @IsOptional()
    expectedTime?: Date;
}
