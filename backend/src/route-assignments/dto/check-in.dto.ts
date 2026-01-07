import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CheckInDto {
    @IsString()
    assignmentId: string;

    @IsNumber()
    latitude: number;

    @IsNumber()
    longitude: number;
}

export class CancelAssignmentDto {
    @IsString()
    @IsOptional()
    reason?: string;
}
