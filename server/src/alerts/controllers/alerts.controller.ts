import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { AlertsService } from '../services/alerts.service';
import { CreateAlertDto } from '../dto/alert.dto';

@Controller('alerts')
export class AlertsController {
    constructor(private readonly alertsService: AlertsService) { }

    @Get()
    async getAllAlerts() {
        return this.alertsService.findAll();
    }

    @Get('stop/:stopId/active')
    async getActiveAlerts(@Param('stopId') stopId: string) {
        return this.alertsService.findActiveByStop(stopId);
    }

    @Post()
    async createAlert(@Body() createAlertDto: CreateAlertDto) {
        return this.alertsService.create(createAlertDto);
    }

    @Put(':id')
    async updateAlert(@Param('id') id: string, @Body() updateAlertDto: Partial<CreateAlertDto>) {
        return this.alertsService.update(id, updateAlertDto);
    }

    @Delete(':id')
    async deleteAlert(@Param('id') id: string) {
        return this.alertsService.delete(id);
    }
}
