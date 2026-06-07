import { Controller, Get, Post, Delete, Put, Body, Param, NotFoundException, HttpCode } from "@nestjs/common";
import { ParkingService } from "../services/park.service";
import { OtpService } from "../../otp/services/otp.service";
import { UpdateParkDto, CreateParkDto, ParkDto } from "../dto/park.dto";
import { SearchParkRequestDto } from "../dto/search-park-request.dto";
import { plainToInstance } from "class-transformer";
import { ParkFeedbackDto, UpdateParkFeedbackDto } from "../dto/park-feedback.dto";

@Controller("pois/park")
export class ParkController {
    constructor(
        private parkService: ParkingService,
        private otpService: OtpService
    ) { }

    @Post("/")
    async create(@Body() park: CreateParkDto): Promise<ParkDto> {
        const insertedPark = await this.parkService.create(park);
        return plainToInstance(ParkDto, insertedPark, {excludeExtraneousValues: true})
    }

    @Get("/")
    async getAll(): Promise<ParkDto[]> {
        const insertedPark = await this.parkService.findAll();
        return plainToInstance(ParkDto, insertedPark, {excludeExtraneousValues: true})
    }

    @Get("/:id")
    async get(@Param("id") id:string ): Promise<ParkDto> {
        const insertedPark = await this.parkService.findParkById(id);
        if (insertedPark === null) {
            throw new NotFoundException();
        }
        return plainToInstance(ParkDto, insertedPark, {excludeExtraneousValues: true})
    }

    @Put("/:id")
    async update(@Param("id") id: string, @Body() partialPark: UpdateParkDto) {
        const park = await this.parkService.updateParkById(id, partialPark);
        if (park === null) {
            throw new NotFoundException();
        }
        return plainToInstance(ParkDto, park, { excludeExtraneousValues: true });
    }

    @Delete("/:id")
    async delete(@Param("id") id: string): Promise<ParkDto> {
        const deletedPark = await this.parkService.deleteParkById(id);
        if (deletedPark === null) {
            throw new NotFoundException();
        }
        return plainToInstance(ParkDto, deletedPark, { excludeExtraneousValues: true })
    }

    @Post("/search")
    @HttpCode(200)
    async search(@Body() request: SearchParkRequestDto): Promise<ParkDto[]> {
        const filteredParks = await this.parkService.search(request);
        return plainToInstance(ParkDto, filteredParks, { excludeExtraneousValues: true });
    }

    @Post("/trip/feedback")
    async createTripFeedback(@Body() feedback: ParkFeedbackDto): Promise<ParkFeedbackDto> {
        const createdFeedback = await this.parkService.createFeedback(feedback);
        return plainToInstance(ParkFeedbackDto, createdFeedback, { excludeExtraneousValues: true });
    }

    @Put("/trip/feedback")
    async updateTripFeedback(@Body() feedback: UpdateParkFeedbackDto): Promise<ParkFeedbackDto> {
        const createdFeedback = await this.parkService.updateFeedback(feedback);
        return plainToInstance(ParkFeedbackDto, createdFeedback, { excludeExtraneousValues: true });
    }
}