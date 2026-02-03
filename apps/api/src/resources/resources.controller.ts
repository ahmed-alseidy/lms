import {
  CreateCourseResourceDto,
  CreateLessonResourceDto,
  DownloadResourceDto,
} from "@lms-saas/shared-lib";
import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Optional,
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
import { ResourcesService } from "./resources.service";

@ApiBearerAuth()
@ApiTags("resources")
@Controller()
export class ResourcesController {
  constructor(
    private s3Service: S3Service,
    private resourcesService: ResourcesService
  ) {}

  // Lesson Resources
  @Post("lessons/:lessonId/resources")
  @Roles("teacher")
  async createLessonResource(
    @Param("lessonId", ParseIntPipe) lessonId: number,
    @Body() dto: CreateLessonResourceDto
  ) {
    return this.resourcesService.createLessonResource(lessonId, {
      title: dto.title,
      fileKey: dto.fileKey,
      fileName: dto.fileName,
      fileType: dto.fileType,
      fileSize: parseInt(dto.fileSize, 10),
    });
  }

  @Get("lessons/:lessonId/resources")
  @Roles("teacher", "student")
  async getLessonResources(@Param("lessonId", ParseIntPipe) lessonId: number) {
    return this.resourcesService.getLessonResources(lessonId);
  }

  @Get("lessons/:lessonId/resources/:id")
  @Roles("teacher", "student")
  async getLessonResource(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("enrollmentId", ParseIntPipe) enrollmentId: number = 0
  ) {
    const resource = await this.resourcesService.getLessonResource(id);
    if (!resource) {
      throw new NotFoundException("Lesson resource not found");
    }

    const downloadUrl = await this.s3Service.getSignedUrl(resource.fileKey);

    // Track download if enrollmentId is provided
    if (enrollmentId !== 0) {
      await this.resourcesService.trackDownload(
        enrollmentId,
        "lesson",
        id,
        undefined
      );
    }

    return {
      ...resource,
      downloadUrl,
    };
  }

  @Delete("lessons/:lessonId/resources/:id")
  @Roles("teacher")
  async deleteLessonResource(@Param("id", ParseUUIDPipe) id: string) {
    const resource = await this.resourcesService.getLessonResource(id);
    if (resource) {
      // Delete file from S3
      try {
        await this.s3Service.deleteFile(resource.fileKey);
      } catch (error) {
        // Log error but continue with database deletion
        console.error("Failed to delete file from S3:", error);
      }
    }
    return this.resourcesService.deleteLessonResource(id);
  }

  // Course Resources
  @Post("courses/:courseId/resources")
  @Roles("teacher")
  async createCourseResource(
    @Param("courseId", ParseIntPipe) courseId: number,
    @Body() dto: CreateCourseResourceDto
  ) {
    return this.resourcesService.createCourseResource(courseId, {
      title: dto.title,
      description: dto.description,
      fileKey: dto.fileKey,
      fileName: dto.fileName,
      fileType: dto.fileType,
      fileSize: parseInt(dto.fileSize, 10),
    });
  }

  @Get("courses/:courseId/resources")
  @Roles("teacher", "student")
  async getCourseResources(@Param("courseId", ParseIntPipe) courseId: number) {
    return this.resourcesService.getCourseResources(courseId);
  }

  @Get("courses/:courseId/resources/:id")
  @Roles("teacher", "student")
  async getCourseResource(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("enrollmentId") enrollmentIdStr?: string
  ) {
    const enrollmentId = enrollmentIdStr
      ? parseInt(enrollmentIdStr, 10)
      : undefined;
    const resource = await this.resourcesService.getCourseResource(id);
    if (!resource) {
      throw new NotFoundException("Course resource not found");
    }

    const downloadUrl = await this.s3Service.getSignedUrl(resource.fileKey);

    // Track download if enrollmentId is provided
    if (enrollmentId) {
      await this.resourcesService.trackDownload(
        enrollmentId,
        "course",
        undefined,
        id
      );
    }

    return {
      ...resource,
      downloadUrl,
    };
  }

  @Delete("courses/:courseId/resources/:id")
  @Roles("teacher")
  async deleteCourseResource(@Param("id", ParseUUIDPipe) id: string) {
    const resource = await this.resourcesService.getCourseResource(id);
    if (resource) {
      // Delete file from S3
      try {
        await this.s3Service.deleteFile(resource.fileKey);
      } catch (error) {
        // Log error but continue with database deletion
        console.error("Failed to delete file from S3:", error);
      }
    }
    return this.resourcesService.deleteCourseResource(id);
  }

  // Download Tracking
  @Post("resources/:resourceId/download")
  @Roles("student")
  async trackResourceDownload(
    @Param("resourceId", ParseUUIDPipe) resourceId: string,
    @Body() dto: DownloadResourceDto
  ) {
    return this.resourcesService.trackDownload(
      dto.enrollmentId,
      dto.resourceType,
      dto.resourceType === "lesson" ? resourceId : undefined,
      dto.resourceType === "course" ? resourceId : undefined
    );
  }

  @Get("resources/:resourceId/downloads")
  @Roles("teacher")
  async getDownloadStats(
    @Param("resourceId", ParseUUIDPipe) resourceId: string,
    @Query("type") resourceType: "lesson" | "course"
  ) {
    return this.resourcesService.getDownloadStats(resourceId, resourceType);
  }
}
