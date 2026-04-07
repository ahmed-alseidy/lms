import { CreateMuxVideoDto } from "@lms-saas/shared-lib";
import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  RawBodyRequest,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AllowAnonymous } from "@thallesp/nestjs-better-auth";
import { Roles } from "@/auth/decorators/roles.decorator";
import { PremiumGuard } from "@/auth/guards/premium.guard";
import { MuxService } from "./mux.service";

@Controller("mux")
export class MuxController {
  constructor(private readonly muxService: MuxService) {}

  @UseGuards(PremiumGuard)
  @Post("lessons/:lessonId/upload")
  @Roles("teacher")
  async upload(
    @Param("lessonId", ParseIntPipe) lessonId: number,
    @Body() body: CreateMuxVideoDto
  ) {
    return this.muxService.createDirectUpload(lessonId, body);
  }

  @AllowAnonymous()
  @Post("webhook")
  async webhook(@Req() req: RawBodyRequest<Request>) {
    const rawBody = req.rawBody?.toString() ?? "";
    return this.muxService.handleWebHook(rawBody, req.headers as any);
  }
}
