import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Alert } from '../schemas/alert.schema';
import { CreateAlertDto } from '../dto/alert.dto';

@Injectable()
export class AlertsService {
    constructor(@InjectModel(Alert.name) private alertModel: Model<Alert>) { }

    async findAll(limit: number = 20) {
        return this.alertModel.find().sort({ createdAt: -1 }).limit(limit).exec();
    }

    async findActiveByStop(stopId: string) {
        const now = new Date();
        return this.alertModel.find({
            stopId: new Types.ObjectId(stopId),
            isActive: true,
            validFrom: { $lte: now },
            validUntil: { $gte: now }
        }).exec();
    }

    async create(createAlertDto: CreateAlertDto) {
        const newAlert = new this.alertModel({
            ...createAlertDto,
            stopId: new Types.ObjectId(createAlertDto.stopId),
            createdBy: new Types.ObjectId(createAlertDto.createdBy)
        });
        return newAlert.save();
    }

    async update(id: string, updateAlertDto: Partial<CreateAlertDto>) {
        return this.alertModel.findByIdAndUpdate(
            id,
            updateAlertDto,
            { returnDocument: 'after' }
        ).exec();
    }

    async delete(id: string) {
        return this.alertModel.findByIdAndDelete(id).exec();
    }
}
