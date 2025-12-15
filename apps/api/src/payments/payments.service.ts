import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import axios from "axios";
import { attempt } from "@/utils/error-handling";
import paymentsConfig from "./config/payments.config";

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(paymentsConfig.KEY)
    private _paymentsConfig: ConfigType<typeof paymentsConfig>,
  ) {}

  async getPaymentMethods() {
    console.log(this._paymentsConfig.fawaterak.apiToken);
    const url = `${this._paymentsConfig.fawaterak.baseUrl}/getPaymentmethods`;
    const [response, error] = await attempt(
      axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this._paymentsConfig.fawaterak.apiToken}`,
        },
      })
    );
    if (error) throw new InternalServerErrorException(error.message);

    return response.data;
  }
}
