import { CompleteVideoDto, CreateVideoDto } from "@lms-saas/shared-lib";
import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Roles } from "@/auth/decorators/roles.decorator";
import { MuxService } from "@/mux/mux.service";
import { S3Service } from "@/s3/s3.service";
import { User } from "@/users/decorators/user.decorator";
import { VideosService } from "./videos.service";

@ApiBearerAuth()
@ApiTags("videos")
@Controller("lessons/:lessonId/videos")
export class VideosController {
  constructor(
    private s3Service: S3Service,
    private videosService: VideosService,
    private muxService: MuxService
  ) {}

  @Delete("/:id")
  @Roles("teacher")
  async delete(@Param("id", ParseUUIDPipe) id: string) {
    const [video] = await this.videosService.getVideo(id);
    if (video) {
      if (video.videoType === "mux" && video.muxAssetId) {
        await this.muxService.deleteAsset(video.muxAssetId);
        return;
      }
      const basePath =
        video.manifestKey?.split("/").slice(0, -1).join("/") ?? "";
      await this.s3Service.deleteDirectory(basePath);
    }
    return this.videosService.delete(id);
  }

  @Get("/:id")
  @Roles("teacher", "student")
  async getVideoUrl(@Param("id", ParseUUIDPipe) id: string) {
    const [video] = await this.videosService.getVideo(id);
    if (!video) {
      throw new NotFoundException("Video not found");
    }

    if (video.videoType === "mux") {
      // If webhook hasn't fired yet (e.g. during local dev without a tunnel),
      // fall back to querying Mux directly so polling still resolves.
      console.log(video)
      console.log(video.muxStatus !== "ready" && video.muxStatus !== "errored" && !!video.muxAssetId)
      if (video.muxStatus !== "ready" && video.muxStatus !== "errored" && !!video.muxAssetId) {
        const liveStatus = await this.muxService.getAssetStatus(video.muxAssetId);
      console.log(liveStatus)
        if (liveStatus.status === "ready" && liveStatus.playbackId) {
          await this.muxService.markAsReady(video.muxAssetId, liveStatus.playbackId);
          return {
            videoId: video.id,
            videoType: video.videoType,
            muxPlaybackId: liveStatus.playbackId,
            muxStatus: "ready",
          };
        }
        return {
          videoId: video.id,
          videoType: video.videoType,
          muxPlaybackId: null,
          muxStatus: liveStatus.status,
        };
      }

      return {
        videoId: video.id,
        videoType: video.videoType,
        muxPlaybackId: video.muxPlaybackId,
        muxStatus: video.muxStatus,
      };
    }

    const manifestUrl = await this.s3Service.getSignedUrl(video.manifestKey ?? "");
    const segmentsBaseUrl = video.segmentsKey;

    return {
      videoId: video.id,
      videoType: video.videoType,
      manifestUrl,
      segmentsBaseUrl,
    };
  }

  @Post("/")
  @Roles("teacher")
  async create(
    @User() teacher: any,
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @Body() dto: CreateVideoDto
  ) {
    const videoId = crypto.randomUUID();

    const basePath = `videos/${teacher.id}/${lessonId}/${videoId}`;
    const manifestKey = `${basePath}/playlist.m3u8`;
    const segmentsKey = `${basePath}`;

    return this.videosService.create(lessonId, {
      manifestKey,
      segmentsKey,
      title: dto.title,
    });
  }

  @Post(":videoId/complete")
  @Roles("student")
  completeVideo(
    @Param('videoId', ParseUUIDPipe) videoId: string,
    @Body() dto: CompleteVideoDto
  ) {
    return this.videosService.completeVideo(videoId, dto.enrollmentId);
  }

  @Get(":videoId/completed")
  @Roles("student")
  checkIfCompleted(
    @Param('videoId', ParseUUIDPipe) videoId: string,
    @Query('enrollmentId', ParseIntPipe) enrollmentId: number
  ) {
    return this.videosService.checkIfCompleted(videoId, enrollmentId);
  }
}
