import {
  db,
  GenerateCodesDto,
  students,
  teachers,
  ValidateCodeDto,
} from "@lms-saas/shared-lib";
import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { Session, UserSession } from "@thallesp/nestjs-better-auth";
import { eq } from "drizzle-orm";
import { Roles } from "@/auth/decorators/roles.decorator";
import { RolesGuard } from "@/auth/guards/roles/roles.guard";
import { attempt } from "@/utils/error-handling";
import { CourseCodesService } from "./course-codes.service";

@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller("courses/:courseId/course-codes")
export class CourseCodesController {
  constructor(private readonly courseCodesService: CourseCodesService) {}

  @Post("generate")
  @Roles("teacher")
  async generateCodes(
    @Body() dto: GenerateCodesDto,
    @Param('courseId', ParseIntPipe) courseId: number,
    @Session() session: UserSession
  ) {
    const [teacher, error] = await attempt(
      db.query.teachers.findFirst({
        where: eq(teachers.authUserId, session.user.id),
        columns: {
          teacherId: true,
        },
      })
    );
    if (error) {
      throw new InternalServerErrorException("Cannot find teacher");
    }
    if (!teacher) {
      throw new NotFoundException("Teacher not found");
    }
    return this.courseCodesService.generateCodes(
      courseId,
      dto.quantity,
      teacher.teacherId
    );
  }

  @Post("validate")
  @Roles("student")
  async validateCode(
    @Body() dto: ValidateCodeDto,
    @Param('courseId', ParseIntPipe) courseId: number,
    @Session() session: UserSession
  ) {
    const [student, error] = await attempt(
      db.query.students.findFirst({
        where: eq(students.authUserId, session.user.id),
        columns: {
          id: true,
        },
      })
    );
    if (error) {
      throw new InternalServerErrorException("Cannot find student");
    }
    if (!student) {
      throw new NotFoundException("Student not found");
    }

    return this.courseCodesService.validateAndUseCode(
      dto.code,
      courseId,
      student.id
    );
  }

  @Get()
  @Roles("teacher")
  async getCourseCodes(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Session() session: UserSession
  ) {
    const [teacher, error] = await attempt(
      db.query.teachers.findFirst({
        where: eq(teachers.authUserId, session.user.id),
        columns: {
          teacherId: true,
        },
      })
    );
    if (error) {
      throw new InternalServerErrorException("Cannot find teacher");
    }
    if (!teacher) {
      throw new NotFoundException("Teacher not found");
    }
    return this.courseCodesService.getCourseCodes(courseId, teacher.teacherId);
  }
}
