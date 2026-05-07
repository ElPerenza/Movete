import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    await app.listen(process.env["PORT"] ?? 3000);
}
bootstrap();

const a = { a: 2, b: 4, c: 6 };
