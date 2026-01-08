import { Controller, Get, Post, Body, Param, Delete, Query, Patch } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    findAll(@Query('userId') userId: string) {
        if (!userId) return [];
        return this.notificationsService.findAllByUser(userId);
    }

    @Patch(':id/read')
    markAsRead(@Param('id') id: string, @Query('userId') userId: string) {
        return this.notificationsService.markAsRead(id, userId);
    }

    @Patch('read-all')
    markAllAsRead(@Query('userId') userId: string) {
        return this.notificationsService.markAllAsRead(userId);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Query('userId') userId: string) {
        return this.notificationsService.remove(id, userId);
    }
}
