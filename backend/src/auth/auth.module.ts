import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  imports: [UsersModule, OrganizationsModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule { }
