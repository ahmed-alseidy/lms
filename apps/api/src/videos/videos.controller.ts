import {
  CompleteVideoDto,
  CreateVideoDto,
  UploadDto,
} from "@lms-saas/shared-lib";
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
import { S3Service } from "@/s3/s3.service";
import { User } from "@/users/decorators/user.decorator";
import { VideosService } from "./videos.service";

@ApiBearerAuth()
@ApiTags("videos")
@Controller("lessons/:lessonId/videos")
export class VideosController {
  constructor(
    private s3Service: S3Service,
    private videosService: VideosService
  ) {}

  @Delete('/:id')
  @Roles('teacher')
  async delete(@Param('id') id: string) {
    const video = await this.videosService.getVideo(id);
    if (video.length > 0) {
      // Delete all files in the video directory
      const basePath = video[0].manifestKey.split('/').slice(0, -1).join('/');
      await this.s3Service.deleteDirectory(basePath);
    }
    return this.videosService.delete(id);
  }

  @Get('/:id')
  @Roles('teacher', 'student')
  async getVideoUrl(@Param('id') id: string) {
    const [video] = await this.videosService.getVideo(id);
    if (!video) {
      throw new NotFoundException('Video not found');
    }

    const manifestUrl = await this.s3Service.getSignedUrl(video.manifestKey);

    // For segments, we return the base URL without a signed URL
    // since individual segment files will be requested as needed
    const segmentsBaseUrl = video.segmentsKey;

    return {
      videoId: video.id,
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
