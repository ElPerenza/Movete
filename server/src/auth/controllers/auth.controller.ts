import { Controller, Post, Body, HttpCode, HttpStatus, Req, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { AuthService } from "../services/auth.service";
import { LoginRequestDto } from "../dto/loginRequest.dto";

@Controller("auth")
export class AuthController {
    constructor(private authService: AuthService) { }

    @HttpCode(HttpStatus.OK)
    @Post("login")
    async login(@Body() loginDto: LoginRequestDto, @Req() request: Request) {
        const user = await this.authService.validateUser(loginDto.email, loginDto.password);

        if (!user) {
            throw new UnauthorizedException("Invalid credentials");
        }

        // Save user's ID in the session (Cookie)
        (request.session as any).userId = user._id;

        return { message: "Login successful" };
    }

    @HttpCode(HttpStatus.OK)
    @Post("logout")
    logout(@Req() request: Request) {
        request.session.destroy(() => { });
        return { message: "Logout successful" };
    }
}
