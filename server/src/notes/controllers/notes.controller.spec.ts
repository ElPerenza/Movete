import { Test, TestingModule } from "@nestjs/testing";
import { NotesController } from "./notes.controller";
import { NotesService } from "../services/notes.service";
import { UnauthorizedException } from "@nestjs/common";

describe("NotesController", () => {
    let controller: NotesController;

    const mockNotesService = {
        getNoteForStop: jest.fn(),
        saveOrUpdateNote: jest.fn(),
        deleteNote: jest.fn()
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [NotesController],
            providers: [{ provide: NotesService, useValue: mockNotesService }]
        }).compile();

        controller = module.get<NotesController>(NotesController);
    });

    it("should be defined", () => {
        expect(controller).toBeDefined();
    });

    describe("getMyNote", () => {
        it("should return the note if it exists", async () => {
            const mockReq = { session: { userId: "user123" } } as any;
            mockNotesService.getNoteForStop.mockResolvedValueOnce({ content: "Mia nota" });

            const result = await controller.getMyNote("stop123", mockReq);
            expect(result).toEqual({ content: "Mia nota" });
            expect(mockNotesService.getNoteForStop).toHaveBeenCalledWith("user123", "stop123");
        });

        it("should give UnauthorizedException if user is not logged-in", async () => {
            const mockReq = { session: {} } as any;
            await expect(controller.getMyNote("stop123", mockReq)).rejects.toThrow(UnauthorizedException);
        });
    });

    describe("saveNote", () => {
        it("should save the note", async () => {
            const mockReq = { session: { userId: "user123" } } as any;
            mockNotesService.saveOrUpdateNote.mockResolvedValueOnce({ content: "Nuova nota" });

            const result = await controller.saveNote("stop123", { content: "Nuova nota" }, mockReq);
            expect(result).toEqual({ content: "Nuova nota" });
            expect(mockNotesService.saveOrUpdateNote).toHaveBeenCalledWith("user123", "stop123", "Nuova nota");
        });
    });
});
