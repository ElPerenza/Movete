import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Note, NoteSchema } from './models/notes.schema';
import { NotesController } from './controllers/notes.controller';
import { NotesService } from './services/notes.service';

@Module({
    imports: [MongooseModule.forFeature([{ name: Note.name, schema: NoteSchema }])],
    controllers: [NotesController],
    providers: [NotesService],
})
export class NotesModule { }
