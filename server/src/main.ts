import { ValidationPipe, ConsoleLogger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import session from "express-session";

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
    app.enableCors({
        origin: 'http://localhost:4200',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });
    app.use(
        session({
            secret: process.env["SESSION_SECRET"] ?? "chiavePazza",
            resave: false,
            saveUninitialized: false,
            cookie: {
                httpOnly: true,
                secure: process.env["NODE_ENV"] === "production",
                maxAge: 1000 * 60 * 60 * 24, // 1 day expire
            },
        })
    );

    await app.listen(process.env["PORT"] ?? 3000);
}
bootstrap();
