import { Test, TestingModule } from "@nestjs/testing";
import { UsersController } from "./user.controller";
import { UsersService } from "../services/user.service";
import { UnauthorizedException } from "@nestjs/common";

describe("UsersController", () => {
    let controller: UsersController;
    let service: UsersService;

    const mockUsersService = {
        getFavourites: jest.fn(),
        addFavouriteStop: jest.fn(),
        removeFavouriteStop: jest.fn()
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [{ provide: UsersService, useValue: mockUsersService }]
        }).compile();

        controller = module.get<UsersController>(UsersController);
        service = module.get<UsersService>(UsersService);
    });

    it("should be defined", () => {
        expect(controller).toBeDefined();
    });

    describe("getFavourites", () => {
        it("should return favourite stops", async () => {
            const mockRequest = { session: { userId: "123" } } as any;
            mockUsersService.getFavourites.mockResolvedValue(["stop1", "stop2"]);

            const result = await controller.getFavourites(mockRequest);
            expect(result).toEqual(["stop1", "stop2"]);
            expect(service.getFavourites).toHaveBeenCalledWith("123");
        });

        it("should launch UnauthorizedException if userId is not in the session", async () => {
            const mockRequest = { session: {} } as any;
            await expect(controller.getFavourites(mockRequest)).rejects.toThrow(UnauthorizedException);
        });
    });

    describe("addFavourite and removeFavourite", () => {
        it("should add a stop to user favourites", async () => {
            const mockReq = { session: { userId: "user123" } } as any;
            const result = await controller.addFavourite("stop123", mockReq);

            expect(result).toEqual({ message: "Fermata aggiunta ai preferiti" });
            expect(mockUsersService.addFavouriteStop).toHaveBeenCalledWith("user123", "stop123");
        });

        it("should remove a stop from user favourites", async () => {
            const mockReq = { session: { userId: "user123" } } as any;
            const result = await controller.removeFavourite("stop123", mockReq);

            expect(result).toEqual({ message: "Fermata rimossa dai preferiti" });
            expect(mockUsersService.removeFavouriteStop).toHaveBeenCalledWith("user123", "stop123");
        });
    });
});
