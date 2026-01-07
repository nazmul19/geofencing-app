import { IsString, IsNotEmpty, IsNumber, IsUUID } from 'class-validator';

export class CreateGeofenceDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsNumber()
    latitude: number;

    @IsNumber()
    longitude: number;

    @IsNumber()
    radius: number;

    @IsUUID()
    organizationId: string;
}
