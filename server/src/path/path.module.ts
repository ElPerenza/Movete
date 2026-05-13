import { Module } from '@nestjs/common';
import { PathController } from './controllers/path.controller';
import { PathService } from './servicies/path.service';

@Module({
    controllers: [PathController],
    providers: [PathService]
})
export class PathModule {}
