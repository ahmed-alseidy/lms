import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import s3Config from "@/s3/config/s3.config";
import { S3Service } from "@/s3/s3.service";
import { VideosController } from "./videos.controller";
import { VideosService } from "./videos.service";

@Module({
  imports: [ConfigModule.forFeature(s3Config)],
  controllers: [VideosController],
  providers: [S3Service, VideosService],
})
export class VideosModule {}
