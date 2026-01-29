import {
  CompleteQuizDto,
  CreateQuizAnswerDto,
  CreateQuizDto,
  CreateQuizQuestionDto,
  db,
  SaveAnswerDto,
  StartQuizDto,
  students,
  UpdateQuizAnswerDto,
  UpdateQuizDto,
  UpdateQuizQuestionDto,
} from "@lms-saas/shared-lib";
import {
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { Session, UserSession } from "@thallesp/nestjs-better-auth";
import { eq } from "drizzle-orm";
import { Roles } from "@/auth/decorators/roles.decorator";
import { RolesGuard } from "@/auth/guards/roles/roles.guard";
import { attempt } from "@/utils/error-handling";
import { QuizzesService } from "./quizzes.service";

@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller("lessons/:lessonId/quizzes")
export class QuizzesController {
  constructor(private quizzesService: QuizzesService) {}

  @Post()
  @Roles("teacher")
  async create(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @Body() dto: CreateQuizDto
  ) {
    return this.quizzesService.create(lessonId, dto);
  }

  @Get('/:quizId')
  @Roles('teacher', 'student')
  async findOne(@Param('quizId', ParseUUIDPipe) quizId: string) {
    return this.quizzesService.findOne(quizId);
  }

  @Put("/:quizId")
  @Roles("teacher")
  async update(
    @Param('quizId', ParseUUIDPipe) quizId: string,
    @Body() dto: UpdateQuizDto
  ) {
    return this.quizzesService.update(quizId, dto);
  }

  @Delete('/:quizId')
  @Roles('teacher')
  async delete(@Param('quizId', ParseUUIDPipe) quizId: string) {
    return this.quizzesService.delete(quizId);
  }

  @Post("/:quizId/start")
  @Roles("student")
  async startQuiz(
    @Session() session: UserSession,
    @Param("quizId", ParseUUIDPipe) quizId: string,
    @Body() dto: StartQuizDto
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
    return this.quizzesService.startQuiz(quizId, student.id, dto);
  }

  @Post("/:quizId/save-answer")
  @Roles("student")
  async saveAnswer(
    @Session() session: UserSession,
    @Param("quizId", ParseUUIDPipe) quizId: string,
    @Body() dto: SaveAnswerDto
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
    return this.quizzesService.saveAnswer(quizId, student.id, dto);
  }

  @Get("/:quizId/resume")
  @Roles("student")
  async resumeQuiz(
    @Session() session: UserSession,
    @Param("quizId", ParseUUIDPipe) quizId: string,
    @Query("enrollmentId", ParseIntPipe) enrollmentId: number
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
    return this.quizzesService.resumeQuiz(quizId, student.id, {
      enrollmentId,
    });
  }

  @Post("/:quizId/submit")
  @Roles("student")
  async completeQuiz(
    @Session() session: UserSession,
    @Param("quizId", ParseUUIDPipe) quizId: string,
    @Body() dto: CompleteQuizDto
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
    return this.quizzesService.completeQuiz(quizId, student.id, dto);
  }

  @Get("/:quizId/completed")
  @Roles("student")
  async checkIfCompleted(
    @Session() session: UserSession,
    @Param('quizId', ParseUUIDPipe) quizId: string
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
    return this.quizzesService.checkIfCompleted(quizId, student.id);
  }

  @Get('/:quizId/questions')
  @Roles('teacher', 'student')
  async getQuizQuestions(@Param('quizId', ParseUUIDPipe) quizId: string) {
    return this.quizzesService.getQuizQuestions(quizId);
  }

  @Post("/:quizId/questions")
  @Roles("teacher")
  async createQuestion(
    @Param('quizId', ParseUUIDPipe) quizId: string,
    @Body() dto: CreateQuizQuestionDto
  ) {
    return this.quizzesService.createQuestion(quizId, dto);
  }

  @Get('/:quizId/questions/:questionId')
  @Roles('teacher', 'student')
  async findQuestion(@Param('questionId', ParseIntPipe) questionId: number) {
    return this.quizzesService.findQuestion(questionId);
  }

  @Put("/:quizId/questions/:questionId")
  @Roles("teacher")
  async updateQuestion(
    @Param('questionId', ParseIntPipe) questionId: number,
    @Body() dto: UpdateQuizQuestionDto
  ) {
    return this.quizzesService.updateQuestion(questionId, dto);
  }

  @Delete('/:quizId/questions/:questionId')
  @Roles('teacher')
  async deleteQuestion(@Param('questionId', ParseIntPipe) questionId: number) {
    return this.quizzesService.deleteQuestion(questionId);
  }

  @Post("/:quizId/questions/:questionId/answers")
  @Roles("teacher")
  async createAnswer(
    @Param('questionId', ParseIntPipe) questionId: number,
    @Body() dto: CreateQuizAnswerDto
  ) {
    return this.quizzesService.createAnswer(questionId, dto);
  }

  @Put("/:quizId/questions/:questionId/answers/:answerId")
  @Roles("teacher")
  async updateAnswer(
    @Param('answerId', ParseIntPipe) answerId: number,
    @Body() dto: UpdateQuizAnswerDto
  ) {
    return this.quizzesService.updateAnswer(answerId, dto);
  }

  @Delete('/:quizId/questions/:questionId/answers/:answerId')
  @Roles('teacher')
  async deleteAnswer(@Param('answerId', ParseIntPipe) answerId: number) {
    return this.quizzesService.deleteAnswer(answerId);
  }

  @Get("/:quizId/results")
  @Roles("student")
  async getQuizResults(
    @Session() session: UserSession,
    @Param("quizId", ParseUUIDPipe) quizId: string
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
    return this.quizzesService.getQuizResults(student.id, quizId);
  }

  @Get("/:quizId/analytics")
  @Roles("teacher")
  async getQuizAnalytics(
    @Param("quizId", ParseUUIDPipe) quizId: string
  ) {
    return this.quizzesService.getQuizAnalytics(quizId);
  }
}
