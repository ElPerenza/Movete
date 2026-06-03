import { Test, TestingModule } from '@nestjs/testing';
import { AlertsController } from './alerts.controller';
import { AlertsService } from '../services/alerts.service';

describe('AlertsController', () => {
    let controller: AlertsController;

    const mockAlertsService = {
        findAll: jest.fn(),
        findActiveByStop: jest.fn(),
        create: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AlertsController],
            providers: [{ provide: AlertsService, useValue: mockAlertsService }],
        }).compile();

        controller = module.get<AlertsController>(AlertsController);
    });

    it('dovrebbe ritornare tutti gli alert', async () => {
        mockAlertsService.findAll.mockResolvedValue([{ title: 'Test Alert' }]);

        // Rimosso il 5 sia dalla chiamata che dall'expect
        const result = await controller.getAllAlerts();
        expect(result).toEqual([{ title: 'Test Alert' }]);
        expect(mockAlertsService.findAll).toHaveBeenCalledWith();
    });
});
