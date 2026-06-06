import { IsNotEmpty, IsString } from 'class-validator';

export class NoteDto {
    @IsNotEmpty()
    @IsString()
    content: string;
}
