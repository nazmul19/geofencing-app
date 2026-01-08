import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification)
        private notificationRepository: Repository<Notification>,
    ) { }

    async create(data: {
        userId: string;
        title: string;
        message: string;
        type?: NotificationType;
    }) {
        const notification = this.notificationRepository.create(data);
        await this.notificationRepository.save(notification);

        // Cleanup: keep only last 50 for this user
        await this.cleanupOldNotifications(data.userId);

        return notification;
    }

    async cleanupOldNotifications(userId: string) {
        const limit = 50;
        const [notifications, count] = await this.notificationRepository.findAndCount({
            where: { userId },
            order: { createdAt: 'DESC' },
        });

        if (count > limit) {
            const toDelete = notifications.slice(limit);
            const idsToDelete = toDelete.map((n) => n.id);
            await this.notificationRepository.delete(idsToDelete);
        }
    }

    findAllByUser(userId: string) {
        return this.notificationRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }

    async markAsRead(id: string, userId: string) {
        await this.notificationRepository.update({ id, userId }, { isRead: true });
        return { success: true };
    }

    async markAllAsRead(userId: string) {
        await this.notificationRepository.update({ userId }, { isRead: true });
        return { success: true };
    }

    async remove(id: string, userId: string) {
        await this.notificationRepository.delete({ id, userId });
        return { success: true };
    }
}
