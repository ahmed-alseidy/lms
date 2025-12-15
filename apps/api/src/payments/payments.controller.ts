import { Controller, Get } from "@nestjs/common";
import { Public } from "@/auth/decorators/public.decorator";
import { PaymentsService } from "./payments.service";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Get("methods")
  async getPaymentMethods() {
    return this.paymentsService.getPaymentMethods();
  }
}
