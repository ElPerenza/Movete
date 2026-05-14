import { Module } from '@nestjs/common';
import { PathController } from './controllers/path.controller';
import { PathService } from './servicies/path.service';

@Module({
    imports: [],
    controllers: [PathController],
    providers: [PathService],
    exports: [PathService]
})
export class PathModule {}
