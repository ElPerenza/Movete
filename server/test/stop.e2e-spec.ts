import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { ConfigService } from '@nestjs/config';

import { StopController } from '../src/poi/controllers/stop.controller';
import { StopService } from '../src/poi/services/stop.service';
import { OtpService } from '../src/otp/services/otp.service';
import { ParkController } from '../src/poi/controllers/park.controller'
import { ParkingService } from '../src/poi/services/park.service'

describe('StopController E2E', () => {
    let app: INestApplication;

    const mockStopService = {
        create: jest.fn(),
        findAll: jest.fn(),
        findStopById: jest.fn(),
        updateStopById: jest.fn(),
        deleteStopById: jest.fn(),
        search: jest.fn(),
        getTripWeeklyStats: jest.fn(),
        createTripFeedback: jest.fn(),
    };

    const mockOtpService = {
        getStoptimes: jest.fn(),
        getRouteShortNameByTripId: jest.fn(),
    };

    const mockConfigService = {
        get: jest.fn().mockReturnValue('mocked_env_value'),
        getOrThrow: jest.fn().mockReturnValue('mocked_env_value'),
    };

    const mockParkingService = {
        create: jest.fn(),
        findAll: jest.fn(),
        findParkById: jest.fn(),
        updateParkById: jest.fn(),
        deleteParkById: jest.fn(),
        search: jest.fn(),
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            controllers: [StopController, ParkController], 
            providers: [
                { provide: StopService, useValue: mockStopService },
                { provide: ParkingService, useValue: mockParkingService },
                { provide: OtpService, useValue: mockOtpService },
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
        
        await app.init();

    });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  // ==========================================
  // 1. CREAZIONE FERMATE (POST /pois/stop)
  // ==========================================
  describe('POST /pois/stop', () => {
    it('should create a new stop with valid data', async () => {
      const payload = {
        name: 'Rovereto Centro',
        location: { type: 'Point', coordinates: [11.04, 45.89] },
        transportModes: ['BUS'],
        otpStops: ['IT:TN:999'],
      };

      mockStopService.create.mockResolvedValue({
        id: 'mocked-stop-id',
        _id: 'mocked-stop-id',
        ...payload,
      });

      const response = await request(app.getHttpServer())
        .post('/pois/stop')
        .send(payload)
        .expect(201);

      expect(response.body).toHaveProperty('id', 'mocked-stop-id');
      expect(response.body.name).toBe('Rovereto Centro');
    });

    it('should return 400 Bad Request on invalid payload format', async () => {
      const invalidPayload = {
        name: '',
        location: { type: 'Point', coordinates: ['not-a-number', 45.89] },
        transportModes: 'NOT_AN_ARRAY',
      };

      await request(app.getHttpServer())
        .post('/pois/stop')
        .send(invalidPayload)
        .expect(400);
    });
  });

  // ==========================================
  // 2. RECUPERO TUTTE LE FERMATE (GET /pois/stop)
  // ==========================================
  describe('GET /pois/stop', () => {
    it('should retrieve all available stops mapped by StopDto', async () => {
      const mockList = [
        { id: 'id-1', name: 'Stop A', location: { type: 'Point', coordinates: [11.0, 45.0] }, transportModes: ['BUS'], otpStops: ['OTP1'] },
        { id: 'id-2', name: 'Stop B', location: { type: 'Point', coordinates: [11.1, 45.1] }, transportModes: ['TRAIN'], otpStops: ['OTP2'] },
      ];

      mockStopService.findAll.mockResolvedValue(mockList);

      const response = await request(app.getHttpServer())
        .get('/pois/stop')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('id', 'id-1');
      expect(response.body[1].name).toBe('Stop B');
    });
  });

  // ==========================================
  // 3. RECUPERO FERMATA SINGOLA (GET /pois/stop/:id)
  // ==========================================
  describe('GET /pois/stop/:id', () => {
    it('should retrieve a specific stop by an existing ID', async () => {
      const mockStop = {
        id: 'existing-id',
        name: 'Stazione FS',
        location: { type: 'Point', coordinates: [11.04, 45.89] },
        transportModes: ['TRAIN'],
        otpStops: ['IT:TN:111'],
      };

      mockStopService.findStopById.mockResolvedValue(mockStop);

      const response = await request(app.getHttpServer())
        .get('/pois/stop/existing-id')
        .expect(200);

      expect(response.body).toHaveProperty('id', 'existing-id');
      expect(response.body.name).toBe('Stazione FS');
    });

    it('should return 404 if the stop does not exist', async () => {
      mockStopService.findStopById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/pois/stop/non-existent-id')
        .expect(404);
    });
  });

  // ==========================================
  // 4. AGGIORNAMENTO FERMATE (PUT /pois/stop/:id)
  // ==========================================
  describe('PUT /pois/stop/:id', () => {
    it('should successfully update an existing stop', async () => {
      const updateDto = { name: 'Rovereto Ospedale' };
      const updatedStop = {
        id: 'stop-id',
        name: 'Rovereto Ospedale',
        location: { type: 'Point', coordinates: [11.04, 45.89] },
        transportModes: ['BUS'],
        otpStops: ['IT:TN:999'],
      };

      mockStopService.updateStopById.mockResolvedValue(updatedStop);

      const response = await request(app.getHttpServer())
        .put('/pois/stop/stop-id')
        .send(updateDto)
        .expect(200);

      expect(response.body.name).toBe('Rovereto Ospedale');
    });

    it('should return 404 when trying to update a non-existent stop', async () => {
      mockStopService.updateStopById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .put('/pois/stop/missing-id')
        .send({ name: 'Nome Caso Errore' })
        .expect(404);
    });
  });

  // ==========================================
  // 5. CANCELLAZIONE FERMATE (DELETE /pois/stop/:id)
  // ==========================================
  describe('DELETE /pois/stop/:id', () => {
    it('should delete a stop and return its old state', async () => {
      const deletedStop = { id: 'deleted-id', name: 'Fermata Vecchia' };
      mockStopService.deleteStopById.mockResolvedValue(deletedStop);

      const response = await request(app.getHttpServer())
        .delete('/pois/stop/deleted-id')
        .expect(200);

      expect(response.body.id).toBe('deleted-id');
    });

    it('should return 404 if stop to delete does not exist', async () => {
      mockStopService.deleteStopById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .delete('/pois/stop/missing-id')
        .expect(404);
    });
  });

  // ==========================================
  // 6. RICERCA GEO-SPAZIALE (POST /pois/stop/search)
  // ==========================================
  describe('POST /pois/stop/search', () => {
    it('should return near stops filtered by geo-query parameters', async () => {
      const searchPayload = { "bbox": 
        { "topLeft": { 
            "type": "Point", 
               "coordinates": [11.11, 46.08] }, 
               "bottomRight": { 
                    "type": "Point", 
                    "coordinates": [11.14, 46.05] 
                } 
            }, 
            "transportTypes": ["BUS"] 
        }

      mockStopService.search.mockResolvedValue([
        { id: 'near-id', name: 'Fermata Vicina' },
      ]);

      const response = await request(app.getHttpServer())
        .post('/pois/stop/search')
        .send(searchPayload)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0].name).toBe('Fermata Vicina');
    });
  });

// ==========================================
// 7. RICERCA GEO-SPAZIALE (POST /pois/stop/search)
// ==========================================
describe('POST /pois/stop/search', () => {
    it('should return error missing type coordinate on the bottom right point', async () => {
      const searchPayload = { "bbox": 
        { "topLeft": { 
            "type": "Point", 
               "coordinates": [11.11, 46.08] }, 
               "bottomRight": { 
                    "type": "Point"
                } 
            }, 
            "transportTypes": ["BUS"] 
        }

      mockStopService.search.mockResolvedValue([
        { id: 'near-id', name: 'Fermata Vicina' },
      ]);

      const response = await request(app.getHttpServer())
        .post('/pois/stop/search')
        .send(searchPayload)
        .expect(400);

    });
  });

  // ==========================================
  // 8. ORARI E CORSE (GET /pois/stop/:id/stop-times)
  // ==========================================
  describe('GET /pois/stop/:id/stop-times', () => {
    it('should aggregate and sort stop times from OtpService', async () => {
      const mockStop = {
        id: 'stop-id',
        otpStops: ['IT:TN:A', 'IT:TN:B'],
      };

      const mockTimesFromA = [
        { stoptime: { scheduledDeparture: new Date('2026-06-10T10:30:00Z') } },
      ];
      const mockTimesFromB = [
        { stoptime: { scheduledDeparture: new Date('2026-06-10T10:15:00Z') } },
      ];

      mockStopService.findStopById.mockResolvedValue(mockStop);
      mockOtpService.getStoptimes
        .mockResolvedValueOnce(mockTimesFromA)
        .mockResolvedValueOnce(mockTimesFromB);

      const response = await request(app.getHttpServer())
        .get('/pois/stop/stop-id/stop-times')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0].stoptime.scheduledDeparture).toBe(mockTimesFromB[0].stoptime.scheduledDeparture.toISOString());
    });

    it('should return 404 for stop-times if stop does not exist', async () => {
      mockStopService.findStopById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/pois/stop/unknown-id/stop-times')
        .expect(404);
    });
  });

  // ==========================================
  // 9. TRIP FEEDBACK & WEEKLY OVERVIEW
  // ==========================================
  describe('TRIP FEEDBACKS AND STATS', () => {
    it('POST /pois/stop/trip/feedback - should record a trip feedback', async () => {
      const feedbackPayload = {
        tripId: 'trip-xyz',
        headsign: 'hccp://',
        userId: 'trycheckup',
        feedback: 5,
        feedbackDate: new Date(),
        day: 3
      };

      mockStopService.createTripFeedback.mockResolvedValue({
        id: 'feedback-id',
        ...feedbackPayload,
      });

      const response = await request(app.getHttpServer())
        .post('/pois/stop/trip/feedback')
        .send(feedbackPayload)
        .expect(201);

      expect(response.body).toHaveProperty('tripId', 'trip-xyz');
    });

    it('GET /pois/stop/trip/feedback/:tripId/weekly-overview - should retrieve overview object', async () => {
      const mockOverview = {
        globalAverageFeedback: 4.2,
        globalTotalFeedbacks: 25,
        weeklyData: [],
      };

      mockStopService.getTripWeeklyStats.mockResolvedValue(mockOverview);

      const response = await request(app.getHttpServer())
        .get('/pois/stop/trip/feedback/trip-xyz/weekly-overview')
        .expect(200);

      expect(response.body.globalAverageFeedback).toBe(4.2);
      expect(response.body.globalTotalFeedbacks).toBe(25);
    });
  });

  // ==========================================
  // 10. UTILITY INTEGRATE DA OTP
  // ==========================================
  describe('GET /pois/stop/trip/:tripId/details', () => {
    it('should map the raw trip proxy route data from OtpService', async () => {
      mockOtpService.getRouteShortNameByTripId.mockResolvedValue('Linea 12');

      const response = await request(app.getHttpServer())
        .get('/pois/stop/trip/trip-777/details')
        .expect(200);

      expect(response.text).toBe('Linea 12');
    });
  });

  // ==========================================
  // 1. CREAZIONE PARCHEGGI (POST /pois/park)
  // ==========================================
  describe('POST /pois/park', () => {
    it('should create a new park with valid data', async () => {
      const payload = {
        otpId: 'OTP-PARK-123',
        trentinoApiId: 'TRENTO-API-123',
        name: 'Parcheggio Rovereto Centro',
        location: { type: 'Point', coordinates: [11.04, 45.89] },
        parkType: 'car',
        maxCapacity: 100,
        currentCapacity: 45,
        
      };

      mockParkingService.create.mockResolvedValue({
        id: "mocked-park-id",
        _id: 'mocked-park-id',
        ...payload,
      });

      const response = await request(app.getHttpServer())
        .post('/pois/park')
        .send(payload)
        .expect(201);

      expect(response.body).toHaveProperty('id', 'mocked-park-id');
      expect(response.body.name).toBe('Parcheggio Rovereto Centro');
    });

    it('should return 400 Bad Request on invalid payload format', async () => {
      const invalidPayload = {
        name: '',
        location: { type: 'Point', coordinates: ['not-a-number', 45.89] },
        parkType: 12345,
      };

      await request(app.getHttpServer())
        .post('/pois/park')
        .send(invalidPayload)
        .expect(400);
    });
  });

  // ==========================================
  // 2. RECUPERO TUTTI I PARCHEGGI (GET /pois/park)
  // ==========================================
  describe('GET /pois/park', () => {
    it('should retrieve all available parks mapped by ParkDto', async () => {
      const mockList = [
        { id: 'id-1', name: 'Park A', location: { type: 'Point', coordinates: [11.0, 45.0] }, parkType: 'car', maxCapacity: 50 },
        { id: 'id-2', name: 'Park B', location: { type: 'Point', coordinates: [11.1, 45.1] }, parkType: 'bike', maxCapacity: 20 },
      ];

      mockParkingService.findAll.mockResolvedValue(mockList);

      const response = await request(app.getHttpServer())
        .get('/pois/park')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('id', 'id-1');
      expect(response.body[1].name).toBe('Park B');
    });
  });

  // ==========================================
  // 3. RECUPERO PARCHEGGIO SINGOLO (GET /pois/park/:id)
  // ==========================================
  describe('GET /pois/park/:id', () => {
    it('should retrieve a specific park by an existing ID', async () => {
      const mockPark = {
        id: 'existing-id',
        name: 'Autosilo Stazione',
        location: { type: 'Point', coordinates: [11.04, 45.89] },
        parkType: 'car',
        maxCapacity: 150,
      };

      mockParkingService.findParkById.mockResolvedValue(mockPark);

      const response = await request(app.getHttpServer())
        .get('/pois/park/existing-id')
        .expect(200);

      expect(response.body).toHaveProperty('id', 'existing-id');
      expect(response.body.name).toBe('Autosilo Stazione');
    });

    it('should return 404 if the park does not exist', async () => {
      mockParkingService.findParkById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/pois/park/non-existent-id')
        .expect(404);
    });
  });

  // ==========================================
  // 4. AGGIORNAMENTO PARCHEGGI (PUT /pois/park/:id)
  // ==========================================
  describe('PUT /pois/park/:id', () => {
    it('should successfully update an existing park', async () => {
      const updateDto = { name: 'Parcheggio Rovereto Ospedale' };
      const updatedPark = {
        id: 'park-id',
        name: 'Parcheggio Rovereto Ospedale',
        location: { type: 'Point', coordinates: [11.04, 45.89] },
        parkType: 'car',
        maxCapacity: 100,
      };

      mockParkingService.updateParkById.mockResolvedValue(updatedPark);

      const response = await request(app.getHttpServer())
        .put('/pois/park/park-id')
        .send(updateDto)
        .expect(200);

      expect(response.body.name).toBe('Parcheggio Rovereto Ospedale');
    });

    it('should return 404 when trying to update a non-existent park', async () => {
      mockParkingService.updateParkById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .put('/pois/park/missing-id')
        .send({ name: 'Nome Caso Errore' })
        .expect(404);
    });
  });

  // ==========================================
  // 5. CANCELLAZIONE PARCHEGGI (DELETE /pois/park/:id)
  // ==========================================
  describe('DELETE /pois/park/:id', () => {
    it('should delete a park and return its old state', async () => {
      const deletedPark = { id: 'deleted-id', name: 'Parcheggio Dismesso' };
      mockParkingService.deleteParkById.mockResolvedValue(deletedPark);

      const response = await request(app.getHttpServer())
        .delete('/pois/park/deleted-id')
        .expect(200);

      expect(response.body.id).toBe('deleted-id');
    });

    it('should return 404 if park to delete does not exist', async () => {
      mockParkingService.deleteParkById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .delete('/pois/park/missing-id')
        .expect(404);
    });
  });

  // ==========================================
  // 6. RICERCA GEO-SPAZIALE (POST /pois/park/search)
  // ==========================================
  describe('POST /pois/park/search', () => {
    it('should return near parks filtered by geo-query parameters', async () => {
      const searchPayload = { 
        "bbox": { 
          "topLeft": { 
            "type": "Point", 
            "coordinates": [11.11, 46.08] 
          }, 
          "bottomRight": { 
            "type": "Point", 
            "coordinates": [11.14, 46.05] 
          } 
        }, 
        "parkTypes": ["car"] 
      };

      mockParkingService.search.mockResolvedValue([
        { id: 'near-id', name: 'Parcheggio Vicino' },
      ]);

      const response = await request(app.getHttpServer())
        .post('/pois/park/search')
        .send(searchPayload)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0].name).toBe('Parcheggio Vicino');
    });
  });

  // ==========================================
  // 7. RICERCA GEO-SPAZIALE - VALIDAZIONE (POST /pois/park/search)
  // ==========================================
  describe('POST /pois/park/search - Validation', () => {
    it('should return error missing coordinates on the bottom right point', async () => {
      const searchPayload = { 
        "bbox": { 
          "topLeft": { 
            "type": "Point", 
            "coordinates": [11.11, 46.08] 
          }, 
          "bottomRight": { 
            "type": "Point"
          } 
        }, 
        "parkTypes": ["car"] 
      };

      await request(app.getHttpServer())
        .post('/pois/park/search')
        .send(searchPayload)
        .expect(400); 
    });
  });
});