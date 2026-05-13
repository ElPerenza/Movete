import { Controller, Post } from "@nestjs/common";
import { PathService } from "../servicies/path.service";

@Controller("path")
export class PathController {
    constructor(private pathService: PathService) {}

    @Post("/")
    async createPath(): Promise<string> {
        //TODO implement the path creation, this is just a placeholder
        return "Path created";
    }

}