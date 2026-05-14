import { Controller, Get, Post, Delete, Put, Body, Param, NotFoundException, HttpException, HttpStatus } from "@nestjs/common";
import { StopService } from "../services/stop.service";
import { OtpService } from "../../otp/services/otp.service";
import { StopTime } from "../../otp/models/stop-time.model"
import { StopDto, CreateStopDto, UpdateStopDto } from "../dto/stop.dto";
import { SearchStopRequestDto } from "../dto/search-stop-request.dto";
import { plainToInstance } from "class-transformer";

@Controller("pois/stop")
export class StopController {
    constructor(
        private stopService: StopService,
        private otpService: OtpService
    ) { }

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
        if (requestedStop === null) {
            throw new NotFoundException();
        }
        return plainToInstance(StopDto, requestedStop, { excludeExtraneousValues: true });
    }

    @Put("/:id")
    async update(@Param("id") id: string, @Body() partialStop: UpdateStopDto) {
        const stop = await this.stopService.updateStopById(id, partialStop);
        if (stop === null) {
            throw new NotFoundException();
        }
        return plainToInstance(StopDto, stop, { excludeExtraneousValues: true });
    }

    @Delete("/:id")
    async delete(@Param("id") id: string): Promise<StopDto> {
        const deletedStop = await this.stopService.deleteStopById(id);
        if (deletedStop === null) {
            throw new NotFoundException();
        }
        return plainToInstance(StopDto, deletedStop, { excludeExtraneousValues: true })
    }

    @Post("/search")
    async search(@Body() request: SearchStopRequestDto): Promise<StopDto[]> {
        const filteredStops = await this.stopService.search(request);
        return plainToInstance(StopDto, filteredStops, { excludeExtraneousValues: true });
    }

    @Get("/:id/stop-times")
    async getStopTimes(@Param("id") id: string): Promise<StopTime[]> {
        // Search for stop in DB
        const requestedStop = await this.stopService.findStopById(id);
        if (!requestedStop) {
            throw new NotFoundException('Fermata non trovata');
        }

        // Pass all GTFS IDs to the service
        const gtfsIds = requestedStop.otpStops;
        if (!gtfsIds || gtfsIds.length === 0) {
            throw new HttpException('Nessun ID GTFS associato', HttpStatus.BAD_REQUEST);
        }

        const times = await this.otpService.getStopTimes(gtfsIds);

        // If using ClassSerializerInterceptor or want to filter values --> plainToInstance
        return plainToInstance(StopTime, times);
    }

    @Get("/trip/:tripId/details")
    async getTripDetails(@Param("tripId") tripId: string) {
        if (!tripId) {
            throw new HttpException('Trip ID mancante', HttpStatus.BAD_REQUEST);
        }
        return this.otpService.getTripDetails(tripId);
    }
}
