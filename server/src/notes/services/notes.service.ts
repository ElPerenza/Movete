import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Note, NoteDocument } from '../models/notes.schema';

@Injectable()
export class NotesService {
    constructor(@InjectModel(Note.name) private noteModel: Model<NoteDocument>) { }

    async getNoteForStop(userId: string, stopId: string) {
        return this.noteModel.findOne({
            userId: new Types.ObjectId(userId),
            stopId: new Types.ObjectId(stopId)
        }).exec();
    }

    async saveOrUpdateNote(userId: string, stopId: string, content: string) {
        return this.noteModel.findOneAndUpdate(
            { userId: new Types.ObjectId(userId), stopId: new Types.ObjectId(stopId) },
            { content },
            { returnDocument: 'after', upsert: true }
        ).exec();
    }

    async deleteNote(noteId: string, userId: string) {
        const deletedNote = await this.noteModel.findOneAndDelete({
            _id: new Types.ObjectId(noteId),
            userId: new Types.ObjectId(userId)
        }).exec();

        if (!deletedNote) throw new NotFoundException('Nota non trovata o non autorizzato');
        return deletedNote;
    }
} 
