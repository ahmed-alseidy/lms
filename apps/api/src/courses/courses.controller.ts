import {
  CourseEditDto,
  CreateCourseDto,
  CreateCourseSectionDto,
  db,
  enrollments,
  students,
  teachers,
  UpdateCourseSectionDto,
  UpdateEnrollmentProgressDto,
} from "@lms-saas/shared-lib";
import {
  Body,
  ConflictException,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  InternalServerErrorException,
  MaxFileSizeValidator,
  NotFoundException,
  Param,
  ParseBoolPipe,
  ParseFilePipe,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiBody, ApiConsumes } from "@nestjs/swagger";
import { Session, UserSession } from "@thallesp/nestjs-better-auth";
import { eq } from "drizzle-orm";
import { Roles } from "@/auth/decorators/roles.decorator";
import { Role } from "@/auth/types/roles";
import { CloudinaryService } from "@/cloudinary/cloudinary.service";
import { attempt } from "@/utils/error-handling";
import { CoursesService } from "./courses.service";

@ApiBearerAuth()
@Controller("courses")
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly cloudinaryService: CloudinaryService
  ) {}

  @Roles("teacher")
  @Post()
  create(@Req() req, @Body() dto: CreateCourseDto) {
    return this.coursesService.create(dto, req.user.id);
  }

  @Get("/by-teacher-id")
  async getByTeacherId(
    @Session() session: UserSession,
    @Req() req,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('with-teacher', ParseBoolPipe) withTeacher: boolean,
    @Query('with-enrollments', ParseBoolPipe) withEnrollments: boolean,
    @Query('published', ParseBoolPipe) published: boolean
  ) {
    const offset = (page - 1) * limit;
    return this.coursesService.getByTeacherId(
      session.user.id,
      session.user.role as Role,
      offset,
      limit,
      withTeacher,
      published,
      withEnrollments
    );
  }

  @Get("/enrolled")
  @Roles("student")
  async getEnrolledCourses(
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
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
    const offset = (page - 1) * limit;
    return this.coursesService.getEnrolledCourses(offset, limit, student.id);
  }

  @Get("/:courseId")
  async getOne(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Query('with-enrollments', ParseBoolPipe) withEnrollments: boolean,
    @Query('with-sections', ParseBoolPipe) withSections: boolean,
    @Query('with-course-codes', ParseBoolPipe) withCourseCodes: boolean,
    @Session() session: UserSession
  ) {
    let userId: number | undefined;
    try {
      if (session.user.role === "student") {
        const [student, error] = await attempt(
          db.query.students.findFirst({
            where: eq(students.authUserId, session.user.id),
            columns: {
              id: true,
            },
          })
        );
        if (error) {
          throw new InternalServerErrorException("Cannot find teacher");
        }
        if (!student) {
          throw new NotFoundException("Student not found");
        }
        userId = student?.id;
      } else if (session.user.role === "teacher") {
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
        userId = teacher?.teacherId;
      }

      return this.coursesService.getOne(
        courseId,
        session.user.role === "student" ? userId : undefined,
        withSections,
        withEnrollments,
        withCourseCodes
      );
    } catch (error) {
      throw new InternalServerErrorException("Cannot update course");
    }
  }

  @Put("/:courseId")
  update(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() input: CourseEditDto
  ) {
    try {
      this.coursesService.update(courseId, input);
    } catch (error) {
      throw new InternalServerErrorException("Cannot update course");
    }
  }

  @Delete('/:courseId')
  @Roles('teacher')
  delete(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.coursesService.delete(courseId);
  }

  @Put('/:courseId/publish')
  @Roles('teacher')
  publish(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.coursesService.update(courseId, {
      published: true,
    });
  }

  @Delete('/:courseId/unpublish')
  @Roles('teacher')
  unPublish(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.coursesService.update(courseId, {
      published: false,
    });
  }

  @ApiConsumes("multipart/form-data")
  @ApiBody({
    required: true,
    schema: {
      type: "object",
      properties: {
        coverImage: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @Put("/:courseId/upload-cover-image")
  @Roles("teacher")
  @UseInterceptors(FileInterceptor("coverImage"))
  async uploadCoverImage(
    @Param('courseId', ParseIntPipe) courseId: number,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }),
          new FileTypeValidator({ fileType: 'image/*' }),
        ],
      }),
    )
    file: Express.Multer.File
  ) {
    const result = await this.cloudinaryService.uploadFile(file);
    return this.coursesService.update(courseId, {
      imageUrl: result.secure_url,
    });
  }

  @Post("/:courseId/sections")
  @Roles("teacher")
  addSection(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() dto: CreateCourseSectionDto
  ) {
    try {
      return this.coursesService.addSection(courseId, dto);
    } catch (error) {
      throw new InternalServerErrorException("Cannot add course section");
    }
  }

  @Get('/:courseId/sections')
  @Roles('teacher', 'student')
  getSections(@Param('courseId', ParseIntPipe) courseId: number) {
    try {
      return this.coursesService.getSections(courseId);
    } catch (error) {
      throw new InternalServerErrorException('Cannot find course sections');
    }
  }

  @Get('/:courseId/sections/:sectionId')
  @Roles('teacher', 'student')
  findSection(@Param('sectionId', ParseIntPipe) sectionId: number) {
    try {
      return this.coursesService.findSection(sectionId);
    } catch (error) {
      throw new InternalServerErrorException('Cannot find course section');
    }
  }

  @Put("/:courseId/sections/:sectionId")
  @Roles("teacher")
  updateSection(
    @Param('sectionId', ParseIntPipe) sectionId: number,
    @Body() dto: UpdateCourseSectionDto
  ) {
    try {
      return this.coursesService.updateSection(sectionId, dto);
    } catch (error) {
      throw new InternalServerErrorException("Cannot update course section");
    }
  }

  @Delete('/:courseId/sections/:sectionId')
  @Roles('teacher')
  async deleteSection(@Param('sectionId', ParseIntPipe) sectionId: number) {
    const section = await this.coursesService.findSection(sectionId);
    if (!section) {
      throw new NotFoundException('Section not found');
    }
    try {
      return this.coursesService.deleteSection(sectionId);
    } catch (error) {
      throw new InternalServerErrorException('Cannot delete course section');
    }
  }

  @Post("/:courseId/enroll")
  @Roles("student")
  async enrollInCourse(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Req() req
  ) {
    const studentId = req.user.id;

    let existingEnrollment;
    try {
      existingEnrollment = await db.query.enrollments.findFirst({
        where:
          eq(enrollments.studentId, studentId) &&
          eq(enrollments.courseId, courseId),
      });
    } catch (error) {
      throw new InternalServerErrorException("Failed to enroll in the course");
    }

    if (existingEnrollment) {
      throw new ConflictException("Student is already enrolled in this course");
    }

    try {
      await db.insert(enrollments).values({
        studentId,
        courseId,
        status: "active",
      });

      return { message: "Successfully enrolled in the course" };
    } catch (error) {
      throw new InternalServerErrorException("Failed to enroll in the course");
    }
  }

  @Patch('/update-progress')
  @Roles('student')
  updateProgress(@Body() dto: UpdateEnrollmentProgressDto) {
    return this.coursesService.updateEnrollmentProgress(dto.enrollmentId);
  }

  @Get("/:courseId/sections/:sectionId/previous-completed")
  @Roles("student")
  async checkPreviousSectionCompleted(
    @Param('sectionId', ParseIntPipe) sectionId: number,
    @Query('enrollmentId', ParseIntPipe) enrollmentId: number
  ) {
    return await this.coursesService.checkPreviousSectionCompleted(
      sectionId,
      enrollmentId
    );
  }
}
