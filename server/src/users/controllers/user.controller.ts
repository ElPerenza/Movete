import { Controller, Get, Post, Delete, Param, Req, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { UsersService } from "../services/user.service";

@Controller("users")
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get("favourites")
    async getFavourites(@Req() req: Request) {
        const userId = (req.session as any).userId;
        if (!userId) throw new UnauthorizedException("Non autorizzato");

        return this.usersService.getFavourites(userId);
    }

    @Post("favourites/:stopId")
    async addFavourite(@Param("stopId") stopId: string, @Req() req: Request) {
        const userId = (req.session as any).userId;
        if (!userId) throw new UnauthorizedException("Non autorizzato");

        await this.usersService.addFavouriteStop(userId, stopId);
        return { message: "Fermata aggiunta ai preferiti" };
    }

    @Delete("favourites/:stopId")
    async removeFavourite(@Param("stopId") stopId: string, @Req() req: Request) {
        const userId = (req.session as any).userId;
        if (!userId) throw new UnauthorizedException("Non autorizzato");

        await this.usersService.removeFavouriteStop(userId, stopId);
        return { message: "Fermata rimossa dai preferiti" };
    }
}
