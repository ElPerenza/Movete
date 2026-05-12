import { registerDecorator, ValidationOptions, ValidationArguments } from "class-validator";

export function IsGtfsId(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: "isGtfsId",
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    return typeof value === "string" && /^.+:.+$/.test(value);
                }
            }
        });
    };
}
