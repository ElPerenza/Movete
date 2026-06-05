import { Module } from '@nestjs/common';
import { OtpService } from './services/otp.service';
import { ConfigModule } from '@nestjs/config';
import { GraphQLClientModule } from '../graphql-client/graphql-client.module';

@Module({
    imports: [ConfigModule, GraphQLClientModule],
    providers: [OtpService],
    exports: [OtpService],
})
export class OtpModule { }
