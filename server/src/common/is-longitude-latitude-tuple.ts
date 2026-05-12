import { registerDecorator, ValidationOptions, ValidationArguments, isLongitude, isLatitude } from "class-validator";

export function IsLongitudeLatitudeTuple(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: "isLongitudeLatitudeTuple",
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    return value instanceof Array &&
                            value.length == 2 &&
                            isLongitude(value[0]) &&
                            isLatitude(value[1]);
                }
            }
        });
    };
}
