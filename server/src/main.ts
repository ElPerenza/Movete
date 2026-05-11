import { ValidationPipe, ConsoleLogger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: new ConsoleLogger({
            json: true,
            logLevels: ['log']
        }),
    });
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            forbidNonWhitelisted: true
        })
    );
    await app.listen(process.env["PORT"] ?? 3000);
}
bootstrap();
