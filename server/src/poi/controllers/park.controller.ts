import { Controller, Get, Post, Delete, Put, Body, Param, NotFoundException, HttpCode } from "@nestjs/common";
import { ParkingService } from "../services/park.service";
import { OtpService } from "../../otp/services/otp.service";
import { UpdateParkDto, CreateParkDto, ParkDto } from "../dto/park.dto";
import { SearchParkRequestDto } from "../dto/search-park-request.dto";
import { plainToInstance } from "class-transformer";
import { ParkFeedbackDto, } from "../dto/park-feedback.dto";
import { WeeklyOverview } from "../../common/statistics";

@Controller("pois/park")
export class ParkController {
    constructor(
        private parkService: ParkingService,
        private otpService: OtpService
    ) { }

    @Post("/feedback")
    async createParkFeedback(@Body() feedback: ParkFeedbackDto): Promise<ParkFeedbackDto> {
        const createdFeedback = await this.parkService.createParkFeedback(feedback);
        return plainToInstance(ParkFeedbackDto, createdFeedback, { excludeExtraneousValues: true });
    }

    @Put("/feedback")
    async updateParkFeedback(@Body() feedback: ParkFeedbackDto): Promise<ParkFeedbackDto> {
        const createdFeedback = await this.parkService.updateParkFeedback(feedback);
        return plainToInstance(ParkFeedbackDto, createdFeedback, { excludeExtraneousValues: true });
    }

    @Get("/feedback/:parkId/distribution/:day")
    async getAvgParkFeedback(@Param("parkId") parkId: string, @Param("day") day: number): Promise<{ hour: number; avgFeedback: number }[]> {
        const feedback = await this.parkService.getAvgParkFeedback(parkId, day);
        if (feedback === null) {
            throw new NotFoundException();
        }
        return feedback;
    }

    @Get("/feedback/:parkId/:userId/:day/")
    async getParkFeedback(@Param("parkId") parkId: string, @Param("userId") userId: string, @Param("day") day: number): Promise<ParkFeedbackDto[] | null> {
        const feedback = await this.parkService.getParkFeedback(parkId, userId, day);
        if (feedback === null) {
            throw new NotFoundException();
        }
        return plainToInstance(ParkFeedbackDto, feedback, { excludeExtraneousValues: true });
    }

    @Get("/feedback/:parkId/weekly-overview")
    async getParkingWeeklyStats(@Param("parkId") parkId: string): Promise<WeeklyOverview> {
        // Chiamata al servizio per recuperare l'aggregazione dei dati settimanali
        const stats = await this.parkService.getParkingWeeklyStats(parkId);
        
        if (stats === null || stats === undefined) {
            throw new NotFoundException(`Nessuna statistica trovata per il parcheggio con ID: ${parkId}`);
        }
        
        return stats;
    }

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

    
}