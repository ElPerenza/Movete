import { Injectable, ConflictException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as bcrypt from "bcrypt";
import { User, UserDocument } from "../../users/models/user.schema"


@Injectable()
export class AuthService {
    //Mongoose model Injection:
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>
    ) { }
    async register(email: string, pass: string): Promise<any> {
        // check if email already exists in the real database
        const existingUser = await this.userModel.findOne({ email }).exec();
        if (existingUser) {
            throw new ConflictException("Email già in uso");
        }

        //Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(pass, saltRounds);

        //save new user to MongoDB
        const newUser = new this.userModel({
            email: email,
            password: hashedPassword
        });

        const savedUser = await newUser.save();

        //return user data without the password
        const { password, ...userObj } = savedUser.toObject();

        return userObj;
    }

    async validateUser(email: string, pass: string): Promise<any> {
        //find user in the database
        const user = await this.userModel.findOne({ email }).exec();

        if (user) {
            //compare hashed password
            const isMatch = await bcrypt.compare(pass, user.password);

            if (isMatch) {
                const { password, ...userObj } = user.toObject();
                return userObj;
            }
        }
        return null;
    }

}
