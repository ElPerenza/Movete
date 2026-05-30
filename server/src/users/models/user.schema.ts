import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";


export enum UserRole {
    USER = 'user',
    ADMIN = 'admin',
    EMPLOYEE = 'employee',
}

@Schema()
export class User {
    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ required: true })
    password: string; // Hash bcrypt

    @Prop({ type: String, enum: UserRole, default: UserRole.USER })
    role: UserRole;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
