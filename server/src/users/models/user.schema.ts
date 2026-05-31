import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export enum UserRole {
    USER = "user",
    ADMIN = "admin",
    EMPLOYEE = "employee"
}

@Schema()
export class User {
    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ required: true })
    password: string; // Hash bcrypt

    @Prop({ type: String, enum: UserRole, default: UserRole.USER })
    role: UserRole;

    @Prop({ type: [{ type: Types.ObjectId, ref: "Stop" }], default: [] })
    favouriteStops: Types.ObjectId[];

    //Predisposition for favourite routes
    //@Prop({ type: [String], default: [] })
    //favouriteRoutes: string[];
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
