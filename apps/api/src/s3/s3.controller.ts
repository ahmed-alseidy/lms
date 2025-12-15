import { UploadDto } from "@lms-saas/shared-lib";
import { Body, Controller, Post } from "@nestjs/common";
import { S3Service } from "./s3.service";

@Controller("s3")
export class S3Controller {
  constructor(private readonly s3Service: S3Service) {}

  @Post('generate-presigned-url')
  async generatePresignedUrl(@Body() body: UploadDto) {
    return this.s3Service.generateUploadUrl(
      body.key,
      body.contentType,
      body.expiresIn,
    );
  }
}
