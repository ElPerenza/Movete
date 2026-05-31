import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { User, UserSchema } from '../users/models/user.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])
    ],
    controllers: [AuthController],
    providers: [AuthService],
})
export class AuthModule { }
