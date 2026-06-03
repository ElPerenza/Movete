import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
    let controller: AuthController;

    const mockAuthService = {
        register: jest.fn(),
        validateUser: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [{ provide: AuthService, useValue: mockAuthService }],
        }).compile();

        controller = module.get<AuthController>(AuthController);
    });

    it('dovrebbe essere definito', () => {
        expect(controller).toBeDefined();
    });

    describe('register', () => {
        it('dovrebbe completare la registrazione e ritornare utente', async () => {
            const mockUser = { email: 'test@test.com' };
            mockAuthService.register.mockResolvedValueOnce(mockUser);

            const result = await controller.register({ email: 'test@test.com', password: 'pass' });

            expect(result).toEqual({ message: "Registrazione completata con successo", user: mockUser });
            expect(mockAuthService.register).toHaveBeenCalledWith('test@test.com', 'pass');
        });
    });

    describe('login', () => {
        it('dovrebbe salvare il userId nella sessione per credenziali valide', async () => {
            const mockUser = { _id: 'id123', email: 'test@test.com' };
            mockAuthService.validateUser.mockResolvedValueOnce(mockUser);

            // Finta Request express con oggetto session
            const mockReq = { session: {} } as any;

            const result = await controller.login({ email: 'test@test.com', password: 'pass' }, mockReq);

            expect(result).toEqual({ message: "Login successful" });
            // Controlla che il tuo codice abbia salvato solo l'_id nella sessione
            expect(mockReq.session.userId).toBe('id123');
        });

        it('dovrebbe lanciare UnauthorizedException per credenziali errate', async () => {
            mockAuthService.validateUser.mockResolvedValueOnce(null); // Nessun utente valido
            const mockReq = { session: {} } as any;

            await expect(controller.login({ email: 'test@test.com', password: 'wrong' }, mockReq))
                .rejects.toThrow(UnauthorizedException);
        });
    });

    describe('logout', () => {
        it('dovrebbe distruggere la sessione', () => {
            // Mock della funzione destroy della sessione
            const mockDestroy = jest.fn((cb) => cb());
            const mockReq = { session: { destroy: mockDestroy } } as any;

            const result = controller.logout(mockReq);

            expect(result).toEqual({ message: 'Logout successful' });
            expect(mockDestroy).toHaveBeenCalled();
        });
    });

    describe('getProfile', () => {
        it('dovrebbe ritornare loggedIn e userId se la sessione è attiva', () => {
            const mockReq = { session: { userId: 'id123' } } as any;

            const result = controller.getProfile(mockReq);

            // Si aspetta esattamente ciò che ritorna il tuo controller
            expect(result).toEqual({ loggedIn: true, userId: 'id123' });
        });

        it('dovrebbe lanciare UnauthorizedException se la sessione non ha userId', () => {
            const mockReq = { session: {} } as any; // Sessione vuota

            expect(() => controller.getProfile(mockReq)).toThrow(UnauthorizedException);
        });
    });

});
