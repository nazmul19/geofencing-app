import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class CreateOrganizationDto {
    @IsString()
    @IsNotEmpty()
    emailDomain: string;

    @IsString()
    @IsNotEmpty()
    name: string;
}
