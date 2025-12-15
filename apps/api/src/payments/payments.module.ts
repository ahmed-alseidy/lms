import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import paymentsConfig from "./config/payments.config";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";

@Module({
  imports: [ConfigModule.forFeature(paymentsConfig)],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
