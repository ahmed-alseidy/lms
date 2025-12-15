import {
  db,
  SelectStudent,
  SelectTeacher,
  students,
  teachers,
} from "@lms-saas/shared-lib";
import {
  CreateStudentDto,
  CreateTeacherDto,
} from "@lms-saas/shared-lib/dist/dtos";
import { BadRequestException, Injectable } from "@nestjs/common";
import { hash } from "argon2";
import { eq } from "drizzle-orm";
import { Role } from "@/auth/types/roles";

@Injectable()
export class UsersService {
  async createTeacher(dto: CreateTeacherDto) {
    const { password, email, name, subdomain } = dto;

    const domainExists = await db.query.teachers.findFirst({
      where: eq(teachers.subdomain, subdomain),
    });
    if (domainExists)
      throw new BadRequestException("Subdomain already exists, change it");

    // Hash password
    const passwordHash = await hash(password);
    // Create user
    await db.insert(teachers).values({
      email,
      passwordHash,
      subdomain,
      name,
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

    // Hash password
    const passwordHash = await hash(password);

    // Create user
    await db.insert(students).values({
      email,
      passwordHash,
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

  async updateHashedRefreshToken(
    userId: number,
    role: Role,
    hashedRT: string | null
  ) {
    if (role === "teacher")
      await db
        .update(teachers)
        .set({ hashedRefreshToken: hashedRT })
        .where(eq(teachers.teacherId, userId));
    else
      await db
        .update(students)
        .set({ hashedRefreshToken: hashedRT })
        .where(eq(students.id, userId));
  }
}
