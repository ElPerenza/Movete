import { Body, Controller, Post, Logger } from "@nestjs/common";
import { PathService } from "../servicies/path.service";
import { PathRequestDto } from "../dto/pathRequest.dto";

@Controller("path")
export class PathController {
    constructor(private pathService: PathService) {}

    @Post("/")
    async createPath(@Body() request: PathRequestDto): Promise<string> {
        const path = await this.pathService.findPath(request);
        return path;
    }

}