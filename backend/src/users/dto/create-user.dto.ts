import { IsEmail, IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateUserDto {
    @IsEmail()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;

    @IsOptional()
    @IsString()
    organizationId?: string;

    @IsOptional()
    @IsString()
    role?: string;
}
