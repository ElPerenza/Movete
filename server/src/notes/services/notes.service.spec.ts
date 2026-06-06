import { Test, TestingModule } from "@nestjs/testing";
import { NotesService } from "./notes.service";
import { getModelToken } from "@nestjs/mongoose";
import { Note } from "../models/notes.schema";
import { Types } from "mongoose";

describe("NotesService", () => {
    let service: NotesService;

    const mockNoteModel = {
        findOne: jest.fn().mockReturnThis(),
        findOneAndUpdate: jest.fn().mockReturnThis(),
        findOneAndDelete: jest.fn().mockReturnThis(),
        exec: jest.fn()
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [NotesService, { provide: getModelToken(Note.name), useValue: mockNoteModel }]
        }).compile();

        service = module.get<NotesService>(NotesService);
    });

    it("saveOrUpdateNote should update or insert the note", async () => {
        const mockNote = { content: "Test note" };
        mockNoteModel.exec.mockResolvedValueOnce(mockNote);

        const result = await service.saveOrUpdateNote("507f1f77bcf86cd799439011", "507f191e810c19729de860ea", "Test note");
        expect(result).toEqual(mockNote);
        expect(mockNoteModel.findOneAndUpdate).toHaveBeenCalled();
    });

    describe("deleteNote", () => {
        it("should delete the note if it exists and belongs to user", async () => {
            const mockDeleted = { _id: "note123", content: "test" };
            mockNoteModel.exec.mockResolvedValueOnce(mockDeleted);

            const result = await service.deleteNote("507f1f77bcf86cd799439011", "507f191e810c19729de860ea");
            expect(result).toEqual(mockDeleted);
            expect(mockNoteModel.findOneAndDelete).toHaveBeenCalled();
        });

        it("should launch NotFoundException if the note doesn't get found", async () => {
            mockNoteModel.exec.mockResolvedValueOnce(null); // Simulates nothing found

            await expect(service.deleteNote("507f1f77bcf86cd799439011", "507f191e810c19729de860ea")).rejects.toThrow("Nota non trovata o non autorizzato");
        });
    });
});
