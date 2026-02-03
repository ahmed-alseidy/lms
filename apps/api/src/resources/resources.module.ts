import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import s3Config from "@/s3/config/s3.config";
import { S3Service } from "@/s3/s3.service";
import { ResourcesController } from "./resources.controller";
import { ResourcesService } from "./resources.service";

@Module({
  imports: [ConfigModule.forFeature(s3Config)],
  controllers: [ResourcesController],
  providers: [S3Service, ResourcesService],
})
export class ResourcesModule {}
