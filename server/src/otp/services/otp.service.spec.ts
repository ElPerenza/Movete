import { Test, TestingModule } from '@nestjs/testing';
import { OtpService } from './otp.service';
import { ConfigService } from '@nestjs/config';
import { HttpException } from '@nestjs/common';

// TODO: this file has to be rwritten from sratch to adhere to the new OTPService implementation
// we should've coordinated better to prevent this from happening...

global.fetch = jest.fn();

describe('OtpService', () => {
    let service: OtpService;

    const mockConfigService = {
        getOrThrow: jest.fn().mockReturnValue('http://localhost:8080/otp/gtfs/v1'),
    };

    beforeEach(async () => {
        jest.spyOn(console, 'error').mockImplementation(() => { });

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OtpService,
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        service = module.get<OtpService>(OtpService);
    });

    afterEach(() => {
        jest.clearAllMocks();
        (console.error as jest.Mock).mockRestore();
    });

    it('dovrebbe essere definito', () => {
        expect(service).toBeDefined();
    });

    describe('getStopTimes', () => {
        it('should join the stops, convert dates and sort chronologically', async () => {
            const serviceDay = 1700000000;
            const mockResponse1 = {
                data: {
                    stop: {
                        stoptimesWithoutPatterns: [
                            {
                                headsign: 'Destinazione Lontana',
                                scheduledArrival: 3600,
                                scheduledDeparture: 3700,
                                arrivalDelay: 0,
                                departureDelay: 0,
                                serviceDay: serviceDay,
                                realtime: false,
                                trip: { gtfsId: 'TRIP1', route: { shortName: '1A' } }
                            }
                        ]
                    }
                }
            };

            const mockResponse2 = {
                data: {
                    stop: {
                        stoptimesWithoutPatterns: [
                            {
                                headsign: 'Destinazione Vicina',
                                scheduledArrival: 1000,
                                scheduledDeparture: 1100,
                                arrivalDelay: 10,
                                departureDelay: 10,
                                serviceDay: serviceDay,
                                realtime: true,
                                trip: { gtfsId: 'TRIP2', route: { shortName: '2B' } }
                            }
                        ]
                    }
                }
            };

            (global.fetch as jest.Mock)
                .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(mockResponse1) })
                .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(mockResponse2) });

            const result = await service.getStopTimes(['stop1', 'stop2']);

            expect(result).toHaveLength(2);
            expect(result[0].tripId).toBe('TRIP2');
            expect(result[1].tripId).toBe('TRIP1');

            expect(result[1].scheduledDeparture).toEqual(new Date((serviceDay + 3700) * 1000));
            expect(result[0].realtime).toBe(true);
        });

        it('should ignore IDs that fail HTTP request and resolve the others', async () => {
            (global.fetch as jest.Mock)
                .mockResolvedValueOnce({ ok: false, status: 500 }) // Il primo fallisce
                .mockResolvedValueOnce({
                    ok: true,
                    json: jest.fn().mockResolvedValue({
                        data: { stop: { stoptimesWithoutPatterns: [] } }
                    })
                });

            const result = await service.getStopTimes(['bad_stop', 'good_stop']);
            expect(result).toEqual([]);
        });

        it('should launch HttpException if there is fatal network error', async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));

            await expect(service.getStopTimes(['stop1'])).rejects.toThrow(HttpException);
        });
    });

    describe('getTripDetails', () => {
        it('should return details about the trip with correct time calculation', async () => {
            const mockResponse = {
                data: {
                    trip: {
                        // CAMBIATO DA stoptimes A stoptimesForDate
                        stoptimesForDate: [
                            {
                                stop: { name: 'Stazione Centrale' },
                                scheduledArrival: 3600, // An hour after midnight
                                arrivalDelay: 120,
                                realtime: true
                            }
                        ]
                    }
                }
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValue(mockResponse)
            });

            const result = await service.getTripDetails('TRIP123', '20231025');

            expect(result).toHaveLength(1);
            expect(result[0].stopName).toBe('Stazione Centrale');
            expect(result[0].delay).toBe(120);

            expect(result[0].scheduledArrival).toBeInstanceOf(Date);

            expect(global.fetch).toHaveBeenCalledWith('http://localhost:8080/otp/gtfs/v1', expect.any(Object));
        });
        it('should return an empty array if trip does not exist in OTP graph', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValue({ data: { trip: null } })
            });

            const result = await service.getTripDetails('INVALID_TRIP', '20231025');
            expect(result).toEqual([]);
        });

        it('should launch HttpException in case of fatal error', async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));

            await expect(service.getTripDetails('TRIP123', '20231025')).rejects.toThrow(HttpException);
        });
    });

    describe('getAllStops', () => {
        it('should return list of stops mapped correctly', async () => {
            const mockGraphqlResponse = {
                data: {
                    stops: [
                        { gtfsId: '1', name: 'Stop 1', lat: 45.0, lon: 11.0, vehicleMode: 'BUS' }
                    ]
                }
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce(mockGraphqlResponse),
            });

            const result = await service.getAllStops();

            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('Stop 1');
            expect(global.fetch).toHaveBeenCalledWith('http://localhost:8080/otp/gtfs/v1', expect.any(Object));
        });

        it('should return empty array in case of error from GraphQL', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce({ errors: ['GraphQL Error'] }),
            });

            const result = await service.getAllStops();
            expect(result).toEqual([]);
        });
    });
});
