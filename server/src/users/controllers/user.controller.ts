import { Controller, Get, Post, Delete, Param, Req, UnauthorizedException, Logger } from "@nestjs/common";
import type { Request } from "express";
import { UsersService } from "../services/user.service";

@Controller("users")
export class UsersController {
    constructor(private readonly usersService: UsersService) {}
    private readonly logger = new Logger(UsersController.name);

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

    @Get("favourite-parks")
    async getFavouriteParks(@Req() req: Request) {
        const userId = (req.session as any).userId;
        if (!userId) throw new UnauthorizedException("Non autorizzato");
        this.logger.log("Fetching favourite parks for user:", userId);
        return this.usersService.getFavouriteParks(userId);
    }

    @Post("favourite-parks/:parkId")
    async addFavouritePark(@Param("parkId") parkId: string, @Req() req: Request) {
        const userId = (req.session as any).userId;
        if (!userId) throw new UnauthorizedException("Non autorizzato");

        await this.usersService.addFavouritePark(userId, parkId);
        return { message: "Parcheggio aggiunto ai preferiti" };
    }

    @Delete("favourite-parks/:parkId")
    async removeFavouritePark(@Param("parkId") parkId: string, @Req() req: Request) {
        const userId = (req.session as any).userId;
        if (!userId) throw new UnauthorizedException("Non autorizzato");

        await this.usersService.removeFavouritePark(userId, parkId);
        return { message: "Parcheggio rimosso dai preferiti" };
    }
}
