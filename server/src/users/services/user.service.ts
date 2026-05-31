import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../models/user.schema';

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) { }

    async getFavorites(userId: string) {
        const user = await this.userModel.findById(userId).populate('favoriteStops').exec();
        if (!user) throw new NotFoundException('Utente non trovato');
        return user.favoriteStops;
    }

    async addFavoriteStop(userId: string, stopId: string) {
        return this.userModel.findByIdAndUpdate(
            userId,
            { $addToSet: { favoriteStops: new Types.ObjectId(stopId) } }, // $addToSet evita duplicati!
            { new: true }
        ).exec();
    }

    async removeFavoriteStop(userId: string, stopId: string) {
        return this.userModel.findByIdAndUpdate(
            userId,
            { $pull: { favoriteStops: new Types.ObjectId(stopId) } }, // $pull rimuove dall'array
            { new: true }
        ).exec();
    }
}
