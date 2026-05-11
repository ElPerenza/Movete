import { Controller, Get, Post, Delete, Put, Body, Param, NotFoundException } from "@nestjs/common";
import { StopService } from "../services/stop.service";
import { StopDto, CreateStopDto, UpdateStopDto } from "../dto/stop.dto";
import { SearchStopRequestDto } from "../dto/search-stop-request.dto";
import { plainToInstance } from "class-transformer";

@Controller("pois/stop")
export class StopController {
    constructor(
        private stopService: StopService,
    ) {}

    @Post("/")
    async create(@Body() stop: CreateStopDto): Promise<StopDto> {
        const insertedStop = await this.stopService.create(stop);
        return plainToInstance(StopDto, insertedStop, { excludeExtraneousValues: true });
    }

    @Get("/")
    async getAll(): Promise<StopDto[]> {
        const allStops = await this.stopService.findAll();
        return plainToInstance(StopDto, allStops, { excludeExtraneousValues: true });
    }

    @Get("/:id")
    async get(@Param("id") id: string): Promise<StopDto> {
        const requestedStop = await this.stopService.findStopById(id);
        if(stop === null) {
            throw new NotFoundException();
        }
        return plainToInstance(StopDto, requestedStop, { excludeExtraneousValues: true });
    }

    @Put("/:id")
    async update(@Param("id") id: string, @Body() partialStop: UpdateStopDto) {
        const stop = await this.stopService.updateStopById(id, partialStop);
        if(stop === null) {
            throw new NotFoundException();
        }
        return plainToInstance(StopDto, stop, { excludeExtraneousValues: true });
    }

    @Delete("/:id")
    async delete(@Param("id") id: string): Promise<StopDto> {
        const deletedStop = await this.stopService.deleteStopById(id);
        if(stop === null) {
            throw new NotFoundException();
        }
        return plainToInstance(StopDto, deletedStop, { excludeExtraneousValues: true })
    }

    @Post("/search")
    async search(@Body() request: SearchStopRequestDto): Promise<StopDto[]> {
        const filteredStops = await this.stopService.search(request);
        return plainToInstance(StopDto, filteredStops, { excludeExtraneousValues: true });
    }
}
