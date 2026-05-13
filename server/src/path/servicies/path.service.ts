import { Logger, Injectable } from "@nestjs/common";


@Injectable()
export class PathService {
    private readonly logger = new Logger(PathService.name, { timestamp: true })
    constructor() {}
}