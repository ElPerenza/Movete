import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { AuthService } from "../services/auth.service";
import { UnauthorizedException } from "@nestjs/common";

describe("AuthController", () => {
    let controller: AuthController;

    const mockAuthService = {
        register: jest.fn(),
        validateUser: jest.fn()
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [{ provide: AuthService, useValue: mockAuthService }]
        }).compile();

        controller = module.get<AuthController>(AuthController);
    });

    it("should be defined", () => {
        expect(controller).toBeDefined();
    });

    describe("register", () => {
        it("should complete registration and return user", async () => {
            const mockUser = { email: "test@test.com" };
            mockAuthService.register.mockResolvedValueOnce(mockUser);

            const result = await controller.register({ email: "test@test.com", password: "pass" });

            expect(result).toEqual({ message: "Registration successfully completed", user: mockUser });
            expect(mockAuthService.register).toHaveBeenCalledWith("test@test.com", "pass");
        });
    });

    describe("login", () => {
        it("should save the userId in the session for valid credential", async () => {
            const mockUser = { _id: "id123", email: "test@test.com" };
            mockAuthService.validateUser.mockResolvedValueOnce(mockUser);

            // Fake express Request with session object
            const mockReq = { session: {} } as any;

            const result = await controller.login({ email: "test@test.com", password: "pass" }, mockReq);

            expect(result).toEqual({ message: "Login successful" });
            // Checks if only the _id is saved in the session
            expect(mockReq.session.userId).toBe("id123");
        });

        it("should launch UnauthorizedException for wrong credentials", async () => {
            mockAuthService.validateUser.mockResolvedValueOnce(null); // No valid user
            const mockReq = { session: {} } as any;

            await expect(controller.login({ email: "test@test.com", password: "wrong" }, mockReq)).rejects.toThrow(UnauthorizedException);
        });
    });

    describe("logout", () => {
        it("should destroy session", () => {
            const mockDestroy = jest.fn(cb => cb());
            const mockReq = { session: { destroy: mockDestroy } } as any;

            const result = controller.logout(mockReq);

            expect(result).toEqual({ message: "Logout successful" });
            expect(mockDestroy).toHaveBeenCalled();
        });
    });

    describe("getProfile", () => {
        it("should retrun loggedIn and userId if session is active", () => {
            const mockReq = { session: { userId: "id123" } } as any;

            const result = controller.getProfile(mockReq);

            expect(result).toEqual({ loggedIn: true, userId: "id123" });
        });

        it("should give UnauthorizedException if session doesn't have userId", () => {
            const mockReq = { session: {} } as any; // Empty session

            expect(() => controller.getProfile(mockReq)).toThrow(UnauthorizedException);
        });
    });
});
