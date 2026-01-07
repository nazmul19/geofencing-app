import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { OrganizationsService } from '../organizations/organizations.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private orgService: OrganizationsService,
  ) { }

  async signup(signupDto: any) {
    const { email, password, orgName } = signupDto;

    // Extract domain
    const domain = email.split('@')[1];
    if (!domain) {
      throw new BadRequestException('Invalid email');
    }

    let org = await this.orgService.findByDomain(domain);
    let isNewOrg = false;

    if (!org) {
      // Create new Organization
      org = await this.orgService.create({
        emailDomain: domain,
        name: orgName || domain,
      });
      isNewOrg = true;
    }

    // Create User
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const user = await this.usersService.create({
      email,
      password,
      organizationId: org.id,
      role: isNewOrg ? 'ORG_ADMIN' : 'END_USER', // First user of new org is Admin
    });

    return { user, message: isNewOrg ? 'Organization created. Pending approval.' : 'Joined organization.' };
  }

  async login(loginDto: any) {
    const { email, password } = loginDto;
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.organization?.status !== 'ACTIVE' && user.role !== 'SUPER_USER') {
      throw new UnauthorizedException('Organization is not active');
    }

    // In a real app, generate JWT here
    const { password: _, ...result } = user;
    return result;
  }
}
