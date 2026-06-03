import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../../users/models/user.schema';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
    let service: AuthService;

    // Fake class to sim Mongoose model
    class MockUserModel {
        constructor(private data: any) { }

        save = jest.fn().mockResolvedValue({
            ...this.data,
            toObject: () => this.data
        });

        static exec = jest.fn();
        static findOne = jest.fn().mockReturnValue({ exec: MockUserModel.exec });
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: getModelToken(User.name),
                    useValue: MockUserModel, // Passiamo direttamente la classe costruttrice!
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    afterEach(() => {
        jest.clearAllMocks(); // Ripulisce i mock tra un test e l'altro
    });

    it('dovrebbe essere definito', () => {
        expect(service).toBeDefined();
    });

    describe('register', () => {
        it('should launch ConflictException if email is already in use', async () => {
            MockUserModel.exec.mockResolvedValueOnce({ email: 'test@test.com' });

            await expect(service.register('test@test.com', 'pass123')).rejects.toThrow(ConflictException);
        });

        it('should register new user and return it without password', async () => {
            MockUserModel.exec.mockResolvedValueOnce(null);
            (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashedPassword123');

            const result = await service.register('nuovo@test.com', 'pass123');

            expect(result).toEqual({ email: 'nuovo@test.com' });
            expect(bcrypt.hash).toHaveBeenCalledWith('pass123', 10);
        });
    });

    describe('validateUser', () => {
        it('should return user without password if credentials are correct', async () => {
            const mockFoundUser = {
                email: 'test@test.com',
                password: 'hashedPassword',
                toObject: () => ({ email: 'test@test.com', password: 'hashedPassword' })
            };
            MockUserModel.exec.mockResolvedValueOnce(mockFoundUser);

            // bcrypt giving OK
            (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

            const result = await service.validateUser('test@test.com', 'pass123');

            expect(result).toEqual({ email: 'test@test.com' });
            expect(bcrypt.compare).toHaveBeenCalledWith('pass123', 'hashedPassword');
        });

        it('should return null if the password is wrong', async () => {
            const mockFoundUser = { email: 'test@test.com', password: 'hashedPassword' };
            MockUserModel.exec.mockResolvedValueOnce(mockFoundUser);
            (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

            const result = await service.validateUser('test@test.com', 'wrongpass');
            expect(result).toBeNull();
        });

        it('returns null if user does not exist', async () => {
            MockUserModel.exec.mockResolvedValueOnce(null);

            const result = await service.validateUser('notfound@test.com', 'pass123');
            expect(result).toBeNull();
        });
    });
});
