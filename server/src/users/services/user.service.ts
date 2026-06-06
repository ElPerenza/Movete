import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { User, UserDocument } from "../models/user.schema";

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) { }

    async getFavourites(userId: string) {
        const user = await this.userModel.findById(userId).populate("favouriteStops").exec();
        if (!user) throw new NotFoundException("Utente non trovato");
        return user.favouriteStops;
    }

    async addFavouriteStop(userId: string, stopId: string) {
        return this.userModel.findByIdAndUpdate(
            userId,
            { $addToSet: { favouriteStops: new Types.ObjectId(stopId) } },
            { returnDocument: 'after' }
        ).exec();
    }

    async removeFavouriteStop(userId: string, stopId: string) {
        return this.userModel.findByIdAndUpdate(
            userId,
            { $pull: { favouriteStops: new Types.ObjectId(stopId) } },
            { returnDocument: 'after' }
        ).exec();
    }

}
