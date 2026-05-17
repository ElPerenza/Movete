import { Module } from '@nestjs/common';
import { PathController } from './controllers/path.controller';
import { PathService } from './servicies/path.service';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [ConfigModule],
    controllers: [PathController],
    providers: [PathService],
    exports: [PathService]
})
export class PathModule {}
