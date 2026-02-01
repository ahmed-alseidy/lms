import {
  db,
  SelectStudent,
  SelectTeacher,
  students,
  teachers,
  users,
} from "@lms-saas/shared-lib";
import {
  CreateStudentDto,
  CreateTeacherDto,
  LoginUserDto,
} from "@lms-saas/shared-lib/dist/dtos";
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { fromNodeHeaders } from "better-auth/node";
import { eq } from "drizzle-orm";
import { Role } from "@/auth/types/roles";
import { auth } from "@/lib/auth";
import { attempt } from "@/utils/error-handling";

@Injectable()
export class UsersService {
  async createTeacher(dto: CreateTeacherDto) {
    const { password, email, name, subdomain } = dto;

    const domainExists = await db.query.teachers.findFirst({
      where: eq(teachers.subdomain, subdomain),
    });
    if (domainExists)
      throw new BadRequestException("Subdomain already exists, change it");

    const [authUser, authUserError] = await attempt(
      auth.api.signUpEmail({
        body: {
          name,
          email,
          password,
          role: "teacher",
        },
      })
    );

    if (!authUser || authUserError)
      throw new BadRequestException("Failed to create user");

    await db.insert(teachers).values({
      email,
      subdomain,
      name,
      authUserId: authUser.user.id,
    });
  }

  async createStudent(dto: CreateStudentDto) {
    const { password, email, name, teacherSubdomain } = dto;
    const res = await db.query.teachers.findFirst({
      where: eq(teachers.subdomain, teacherSubdomain),
      columns: {
        teacherId: true,
      },
    });
    if (!res) throw new BadRequestException("No such domain");
    const teacherId = res.teacherId;

    const [authUser, authUserError] = await attempt(
      auth.api.signUpEmail({
        body: {
          name,
          email,
          password,
          role: "student",
        },
      })
    );

    if (!authUser || authUserError)
      throw new BadRequestException("Failed to create user");

    // Create user
    await db.insert(students).values({
      email,
      authUserId: authUser.user.id,
      name,
      teacherId,
    });
  }

  async findTeacherByEmail(email: string) {
    return await db.query.teachers.findFirst({
      where: eq(teachers.email, email),
    });
  }

  async findStudentByEmail(email: string) {
    return await db.query.students.findFirst({
      where: eq(students.email, email),
    });
  }

  async findUser(
    id: number,
    role: Role
  ): Promise<SelectStudent | SelectTeacher | undefined> {
    const user =
      role === "teacher"
        ? await db.query.teachers.findFirst({
            where: eq(teachers.teacherId, id),
          })
        : await db.query.students.findFirst({
            where: eq(students.id, id),
          });
    return user;
  }

  async getCurrentSession(req: Request) {
    const res = await auth.api.getSession({
      headers: req.headers,
    });
    return res;
  }

  async loginUserByEmail(dto: LoginUserDto) {
    const [user, userError] = await attempt(
      db.query.users.findFirst({
        where: eq(users.email, dto.email),
      })
    );
    if (userError)
      throw new InternalServerErrorException("Failed to find user");
    if (!user) throw new BadRequestException("User not found");

    const [res, resError] = await attempt(
      auth.api.signInEmail({
        body: {
          email: dto.email,
          password: dto.password,
        },
        asResponse: true,
        returnHeaders: true,
      })
    );

    if (!res || resError) throw new BadRequestException("Failed to login");
    const cookies: string[] = [];
    res.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        cookies.push(value);
      }
    });
    const cookiesObject = cookies.map((cookie) => {
      const c = cookie.split(";").map((item) => item.trim().split("="));
      const co: Record<string, any> = {};
      c.forEach((item) => {
        if (item[0] === "HttpOnly" || item[0] === "Secure") co[item[0]] = true;
        else co[item[0]] = item[1];
      });
      return co;
    });
    return {
      ...res,
      cookies: cookiesObject[0],
    };
  }
}
