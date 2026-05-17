import { ValidationPipe, ConsoleLogger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: new ConsoleLogger({
            json: Boolean(process.env["JSON_LOGS"]) ?? false,
            logLevels: ['log']
        }),
    });
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            forbidNonWhitelisted: true
        })
    );
    app.enableCors({
        origin: 'http://localhost:4200',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });
    await app.listen(process.env["PORT"] ?? 3000);
}
bootstrap();
