import { Controller, Get, Post, Delete, Param, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from '../services/user.service';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('favorites')
    async getFavorites(@Req() req: Request) {
        const userId = (req.session as any).userId;
        if (!userId) throw new UnauthorizedException('Non autorizzato');

        return this.usersService.getFavorites(userId);
    }

    @Post('favorites/:stopId')
    async addFavorite(@Param('stopId') stopId: string, @Req() req: Request) {
        const userId = (req.session as any).userId;
        if (!userId) throw new UnauthorizedException('Non autorizzato');

        await this.usersService.addFavoriteStop(userId, stopId);
        return { message: 'Fermata aggiunta ai preferiti' };
    }

    @Delete('favorites/:stopId')
    async removeFavorite(@Param('stopId') stopId: string, @Req() req: Request) {
        const userId = (req.session as any).userId;
        if (!userId) throw new UnauthorizedException('Non autorizzato');

        await this.usersService.removeFavoriteStop(userId, stopId);
        return { message: 'Fermata rimossa dai preferiti' };
    }
}
