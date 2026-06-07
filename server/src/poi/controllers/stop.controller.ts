import { Controller, Get, Post, Delete, Put, Body, Param, NotFoundException, HttpCode } from "@nestjs/common";
import { StopService } from "../services/stop.service";
import { OtpService } from "../../otp/services/otp.service";
import { StopDto, CreateStopDto, UpdateStopDto } from "../dto/stop.dto";
import { SearchStopRequestDto } from "../dto/search-stop-request.dto";
import { plainToInstance } from "class-transformer";
import { Stoptime, StoptimeWithTripInfo } from "../../otp/types/otp-types";
import { StopFeedbackDto, UpdateStopFeedbackDto } from "../dto/stop-feedback.dto";
import { TripFeedbackDto, UpdateTripFeedbackDto } from "../dto/trip-feedback.dto";

@Controller("pois/stop")
export class StopController {
    constructor(
        private stopService: StopService,
        private otpService: OtpService
    ) { }

    @Post("/feedback")
    async createFeedback(@Body() feedback: StopFeedbackDto): Promise<StopFeedbackDto> {
        const createdFeedback = await this.stopService.createFeedback(feedback);
        return plainToInstance(StopFeedbackDto, createdFeedback, { excludeExtraneousValues: true });
    }

    @Put("/feedback")
    async updateFeedback(@Body() feedback: UpdateStopFeedbackDto): Promise<StopFeedbackDto> {
        const createdFeedback = await this.stopService.updateFeedback(feedback);
        return plainToInstance(StopFeedbackDto, createdFeedback, { excludeExtraneousValues: true });
    }

    @Post("/trip/feedback")
    async createTripFeedback(@Body() feedback: TripFeedbackDto): Promise<TripFeedbackDto> {
        const createdFeedback = await this.stopService.createTripFeedback(feedback);
        return plainToInstance(TripFeedbackDto, createdFeedback, { excludeExtraneousValues: true });
    }

    @Put("/trip/feedback")
    async updateTripFeedback(@Body() feedback: TripFeedbackDto): Promise<TripFeedbackDto> {
        const createdFeedback = await this.stopService.updateTripFeedback(feedback);
        return plainToInstance(TripFeedbackDto, createdFeedback, { excludeExtraneousValues: true });
    }

    @Get("/trip/feedback/:tripId/:userId")
    async getTripFeedback(@Param("tripId") tripId: string, @Param("userId") userId: string): Promise<TripFeedbackDto> {
        const feedback = await this.stopService.getTripFeedback(tripId, userId);
        if (feedback === null) {
            throw new NotFoundException(`No feedback found for trip ${tripId} and user ${userId}`);
        }
        return plainToInstance(TripFeedbackDto, feedback, { excludeExtraneousValues: true });
    }

    @Get("/trip/feedback/:tripId/")
    async getAvgTripFeedback(@Param("tripId") tripId: string): Promise<number> {
        const feedback = await this.stopService.getAvgTripFeedback(tripId);
        return feedback;
    }

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
    @HttpCode(200)
    async search(@Body() request: SearchStopRequestDto): Promise<StopDto[]> {
        const filteredStops = await this.stopService.search(request);
        return plainToInstance(StopDto, filteredStops, { excludeExtraneousValues: true });
    }

    @Get("/:id/stop-times")
    async getStopTimes(@Param("id") id: string): Promise<StoptimeWithTripInfo[]> {

        const requestedStop = await this.stopService.findStopById(id);
        if (!requestedStop) {
            throw new NotFoundException(`Stop ${id} does not exist`);
        }

        const allStoptimes = await Promise.all(requestedStop.otpStops.map(async otpId => await this.otpService.getStoptimes(otpId, 30)));
        // order by earliest departure time, ascending
        return allStoptimes.flat().sort((st1, st2) => st1.stoptime.scheduledDeparture.getTime() - st2.stoptime.scheduledDeparture.getTime());
    }

    @Get("/trip/:tripId/:serviceDate/details")
    async getTripDetails(@Param("tripId") tripId: string, @Param("serviceDate") serviceDate: number): Promise<Stoptime[]> {
        return this.otpService.getTripStoptimes(tripId, new Date(serviceDate));
    }

    
}
