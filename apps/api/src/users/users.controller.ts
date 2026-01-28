import {
  CreateStudentDto,
  CreateTeacherDto,
  LoginUserDto,
} from "@lms-saas/shared-lib";
import { Body, Controller, Get, HttpCode, Post, Req } from "@nestjs/common";
import {
  AllowAnonymous,
  Session,
  UserSession,
} from "@thallesp/nestjs-better-auth";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('/current-user')
  findCurrentUser(@Req() req) {
    return this.usersService.findUser(req.user.id, req.user.role);
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
    console.log("session", session);
    return session;
  }

  @AllowAnonymous()
  @HttpCode(200)
  @Post('login')
  async login(@Body() dto: LoginUserDto) {
    return this.usersService.loginUserByEmail(dto);
  }
}
