import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './user.controller';
import { UsersService } from '../services/user.service';
import { UnauthorizedException } from '@nestjs/common';

describe('UsersController', () => {
    let controller: UsersController;
    let service: UsersService;

    const mockUsersService = {
        getFavourites: jest.fn(),
        addFavouriteStop: jest.fn(),
        removeFavouriteStop: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [{ provide: UsersService, useValue: mockUsersService }],
        }).compile();

        controller = module.get<UsersController>(UsersController);
        service = module.get<UsersService>(UsersService);
    });

    it('dovrebbe essere definito', () => {
        expect(controller).toBeDefined();
    });

    describe('getFavourites', () => {
        it('dovrebbe ritornare le fermate preferite', async () => {
            const mockRequest = { session: { userId: '123' } } as any;
            mockUsersService.getFavourites.mockResolvedValue(['stop1', 'stop2']);

            const result = await controller.getFavourites(mockRequest);
            expect(result).toEqual(['stop1', 'stop2']);
            expect(service.getFavourites).toHaveBeenCalledWith('123');
        });

        it('dovrebbe lanciare UnauthorizedException se userId manca nella sessione', async () => {
            const mockRequest = { session: {} } as any;
            await expect(controller.getFavourites(mockRequest)).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('addFavourite e removeFavourite', () => {
        it('dovrebbe aggiungere una fermata', async () => {
            const mockReq = { session: { userId: 'user123' } } as any;
            const result = await controller.addFavourite('stop123', mockReq);

            expect(result).toEqual({ message: "Fermata aggiunta ai preferiti" });
            expect(mockUsersService.addFavouriteStop).toHaveBeenCalledWith('user123', 'stop123');
        });

        it('dovrebbe rimuovere una fermata', async () => {
            const mockReq = { session: { userId: 'user123' } } as any;
            const result = await controller.removeFavourite('stop123', mockReq);

            expect(result).toEqual({ message: "Fermata rimossa dai preferiti" });
            expect(mockUsersService.removeFavouriteStop).toHaveBeenCalledWith('user123', 'stop123');
        });
    });
});
