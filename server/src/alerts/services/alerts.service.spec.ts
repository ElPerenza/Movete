import { Test, TestingModule } from "@nestjs/testing";
import { AlertsService } from "./alerts.service";
import { getModelToken } from "@nestjs/mongoose";
import { Alert } from "../schemas/alert.schema";
import { Types } from "mongoose";

describe("AlertsService", () => {
    let service: AlertsService;

    const mockAlertModel = {
        find: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn(),
        findByIdAndUpdate: jest.fn().mockReturnThis(),
        findByIdAndDelete: jest.fn().mockReturnThis(),
        // Mock per il costruttore (new this.alertModel)
        create: jest.fn()
    };

    // Usiamo una factory per il costruttore del modello Mongoose
    class MockAlertModel {
        constructor(private data: any) {}
        save = jest.fn().mockResolvedValue(this.data);
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AlertsService,
                {
                    provide: getModelToken(Alert.name),
                    useValue: { ...mockAlertModel, ...MockAlertModel } // Uniamo mock metodi statici e costruttore
                }
            ]
        }).compile();

        service = module.get<AlertsService>(AlertsService);
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });

    it("findAll should return a list of alert without limits", async () => {
        const mockAlerts = [{ title: "Allerta 1" }];
        mockAlertModel.exec.mockResolvedValueOnce(mockAlerts);

        const result = await service.findAll(); // Rimosso il 10
        expect(result).toEqual(mockAlerts);
        expect(mockAlertModel.find).toHaveBeenCalled();
        expect(mockAlertModel.sort).toHaveBeenCalledWith({ createdAt: -1 });
        // Rimosso l'expect su limit
    });

    it("findActiveByStop should search valid and active alerts", async () => {
        mockAlertModel.exec.mockResolvedValueOnce([{ title: "Active Alert" }]);

        await service.findActiveByStop("stop123");

        expect(mockAlertModel.find).toHaveBeenCalledWith({
            stopId: "stop123",
            isActive: true,
            validFrom: { $lte: expect.any(Date) }, // Verifica che passi una data valida
            validUntil: { $gte: expect.any(Date) }
        });
    });
});
