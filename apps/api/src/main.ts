import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { ValidationPipe } from "@nestjs/common";
import { ENV } from "@app/core/lib/env";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter.js";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor.js";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.setGlobalPrefix("api/v1");
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
			transformOptions: {
				enableImplicitConversion: true,
			},
		}),
	);

	app.useGlobalFilters(new AllExceptionsFilter());
	app.useGlobalInterceptors(new TransformInterceptor());

	await app.listen(ENV.PORT);
}
await bootstrap();
