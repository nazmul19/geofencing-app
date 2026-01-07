import { FactoryProvider } from '@nestjs/common';
import { UsersService } from './users/users.service';
import { CreateUserDto } from './users/dto/create-user.dto';

export const SeedService: FactoryProvider = {
    provide: 'SEED_SERVICE',
    useFactory: async (usersService: UsersService) => {
        // Check if super user exists
        const adminEmail = process.env.SUPER_ADMIN_EMAIL || 'super@admin.com';
        const existing = await usersService.findByEmail(adminEmail);
        if (!existing) {
            console.log('Seeding Super Admin...');
            await usersService.create({
                email: adminEmail,
                password: process.env.SUPER_ADMIN_PASSWORD || 'admin123',
                role: 'SUPER_USER',
                organizationId: undefined
            });
            console.log('Super Admin Seeded');
        }
    },
    inject: [UsersService],
};
