export class CreateAlertDto {
    title: string;
    message: string;
    stopId: string;
    createdBy: string; //UserID by string
    validFrom: Date;
    validUntil: Date;
    isActive?: boolean;
}
