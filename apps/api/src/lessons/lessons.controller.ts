import {
  CompleteLessonDto,
  CreateLessonDto,
  UpdateLessonDto,
} from "@lms-saas/shared-lib";
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { Roles } from "@/auth/decorators/roles.decorator";
import { RolesGuard } from "@/auth/guards/roles/roles.guard";
import { LessonsService } from "./lessons.service";

@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller("courses/:courseId/sections/:sectionId/lessons")
export class LessonsController {
  constructor(private lessonsService: LessonsService) {}

  @Post()
  @Roles("teacher")
  async create(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('sectionId', ParseIntPipe) sectionId: number,
    @Body() dto: CreateLessonDto
  ) {
    return this.lessonsService.create(courseId, sectionId, dto);
  }

  @Get('/:lessonId')
  @Roles('teacher', 'student')
  async findOne(@Param('lessonId', ParseIntPipe) lessonId: number) {
    return await this.lessonsService.findOne(lessonId);
  }

  @Put("/:lessonId")
  @Roles("teacher")
  async update(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @Body() dto: UpdateLessonDto
  ) {
    return await this.lessonsService.update(lessonId, dto);
  }

  @Delete('/:lessonId')
  @Roles('teacher')
  async delete(@Param('lessonId', ParseIntPipe) lessonId: number) {
    return await this.lessonsService.delete(lessonId);
  }

  @Post("/:lessonId/complete")
  @Roles("student")
  async complete(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @Body() dto: CompleteLessonDto
  ) {
    return await this.lessonsService.complete(
      courseId,
      lessonId,
      dto.enrollmentId
    );
  }

  @Get("/:lessonId/completed")
  @Roles("student")
  async checkIfCompleted(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @Query('enrollmentId', ParseIntPipe) enrollmentId: number
  ) {
    return await this.lessonsService.checkIfCompleted(lessonId, enrollmentId);
  }

  @Get("/:lessonId/previous-completed")
  @Roles("student")
  async getPreviousCompleted(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @Query('enrollmentId', ParseIntPipe) enrollmentId: number
  ) {
    return await this.lessonsService.checkPreviousLessonCompleted(
      lessonId,
      enrollmentId
    );
  }
}
