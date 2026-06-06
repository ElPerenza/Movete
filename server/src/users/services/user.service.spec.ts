import { Test, TestingModule } from "@nestjs/testing";
import { UsersService } from "./user.service";
import { getModelToken } from "@nestjs/mongoose";
import { User } from "../models/user.schema";
import { NotFoundException } from "@nestjs/common";
import { Types } from "mongoose";

describe("UsersService", () => {
    let service: UsersService;

    const mockUserModel = {
        findById: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn(),
        findByIdAndUpdate: jest.fn().mockReturnThis()
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: getModelToken(User.name),
                    useValue: mockUserModel
                }
            ]
        }).compile();

        service = module.get<UsersService>(UsersService);
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });

    describe("getFavourites", () => {
        it("should return all the favourite stops if the user exists", async () => {
            const mockUser = { _id: "123", favouriteStops: ["stop1", "stop2"] };
            mockUserModel.exec.mockResolvedValueOnce(mockUser);

            const result = await service.getFavourites("123");
            expect(result).toEqual(["stop1", "stop2"]);
            expect(mockUserModel.findById).toHaveBeenCalledWith("123");
            expect(mockUserModel.populate).toHaveBeenCalledWith("favouriteStops");
        });

        it("should give NotFoundException if user doesn't exist", async () => {
            mockUserModel.exec.mockResolvedValueOnce(null);
            await expect(service.getFavourites("invalid-id")).rejects.toThrow(NotFoundException);
        });
    });

    describe("addFavouriteStop", () => {
        it("should add a stop with $addToSet", async () => {
            mockUserModel.exec.mockResolvedValueOnce({ _id: "123" });
            await service.addFavouriteStop("123", "507f1f77bcf86cd799439011");

            expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith("123", { $addToSet: { favouriteStops: new Types.ObjectId("507f1f77bcf86cd799439011") } }, { returnDocument: "after" });
        });
    });

    describe("removeFavouriteStop", () => {
        it("should remove a stop with $pull", async () => {
            mockUserModel.exec.mockResolvedValueOnce({ _id: "123" });
            await service.removeFavouriteStop("123", "507f1f77bcf86cd799439011");

            expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith("123", { $pull: { favouriteStops: new Types.ObjectId("507f1f77bcf86cd799439011") } }, { returnDocument: "after" });
        });
    });
});
