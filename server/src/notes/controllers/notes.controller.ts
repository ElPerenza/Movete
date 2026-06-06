import { Controller, Get, Post, Delete, Param, Body, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { NotesService } from '../services/notes.service';
import { NoteDto } from '../dto/note.dto';

@Controller('notes')
export class NotesController {
    constructor(private readonly notesService: NotesService) { }

    @Get('poi/:stopId')
    async getMyNote(@Param('stopId') stopId: string, @Req() req: Request) {
        const userId = (req.session as any).userId;
        if (!userId) throw new UnauthorizedException('Non autorizzato');

        const note = await this.notesService.getNoteForStop(userId, stopId);
        return note || { content: '' }; // Se non c'è, ritorna un contenuto vuoto per comodità del Frontend
    }

    @Post('poi/:stopId')
    async saveNote(@Param('stopId') stopId: string, @Body() body: NoteDto, @Req() req: Request) {
        const userId = (req.session as any).userId;
        if (!userId) throw new UnauthorizedException('Non autorizzato');

        return this.notesService.saveOrUpdateNote(userId, stopId, body.content);
    }

    @Delete(':noteId')
    async deleteNote(@Param('noteId') noteId: string, @Req() req: Request) {
        const userId = (req.session as any).userId;
        if (!userId) throw new UnauthorizedException('Non autorizzato');

        await this.notesService.deleteNote(noteId, userId);
        return { message: 'Nota eliminata' };
    }
}
