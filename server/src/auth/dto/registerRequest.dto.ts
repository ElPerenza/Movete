import { IsEmail, IsNotEmpty, MinLength } from "class-validator";

export class RegisterRequestDto {
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @MinLength(6, { message: "La password deve essere di almeno 6 caratteri" })
    password: string;
}
