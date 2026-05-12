import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { OtpModule } from './otp/otp.module';

@Module({
    imports: [OtpModule],
    controllers: [AppController],
    providers: [AppService]
})
export class AppModule { }
