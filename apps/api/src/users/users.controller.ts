import {
  CreateStudentDto,
  CreateTeacherDto,
  LoginUserDto,
} from "@lms-saas/shared-lib";
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  AllowAnonymous,
  Session,
  UserSession,
} from "@thallesp/nestjs-better-auth";
import { Roles } from "@/auth/decorators/roles.decorator";
import { RolesGuard } from "@/auth/guards/roles/roles.guard";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('/current-user')
  findCurrentUser(@Req() req) {
    return this.usersService.findUser(req.user.id, req.user.role);
  }

  @UseGuards(RolesGuard)
  @Roles("teacher")
  @Get("teacher-profile")
  async getTeacherProfile(@Session() session: UserSession) {
    return this.usersService.getTeacherProfile(session.user.id);
  }

  @AllowAnonymous()
  @Post('teacher/register')
  async registerTeacher(@Body() dto: CreateTeacherDto) {
    return this.usersService.createTeacher(dto);
  }

  @AllowAnonymous()
  @Post('student/register')
  async registerStudent(@Body() dto: CreateStudentDto) {
    return this.usersService.createStudent(dto);
  }

  @Get("session")
  async getCurrentSession(
    @Session() session: UserSession,
  ) {
    return session;
  }

  @AllowAnonymous()
  @HttpCode(200)
  @Post('login')
  async login(@Body() dto: LoginUserDto) {
    return this.usersService.loginUserByEmail(dto);
  }
}
