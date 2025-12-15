import {
  CreateStudentDto,
  CreateTeacherDto,
  db,
  SelectStudent,
  SelectTeacher,
  teachers,
} from "@lms-saas/shared-lib";
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { hash, verify } from "argon2";
import { eq } from "drizzle-orm";
import { UsersService } from "src/users/users.service";
import refreshConfig from "./config/refresh.config";
import { JwtPayload } from "./types/jwt-payload";
import { Role } from "./types/roles";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @Inject(refreshConfig.KEY)
    private refreshTokenConfig: ConfigType<typeof refreshConfig>,
  ) {}

  async validateLocalUser(email: string, password: string, role: Role) {
    return role === "teacher"
      ? await this.validateLocalTeacher(email, password)
      : await this.validateLocalStudent(email, password);
  }

  private async validateLocalTeacher(email: string, password: string) {
    const teacher = await this.usersService.findTeacherByEmail(email);
    if (!teacher) throw new UnauthorizedException("User not found!");
    const passwordMatched = await verify(teacher.passwordHash, password);
    if (!passwordMatched)
      throw new UnauthorizedException("Invalid credentials");

    return {
      id: teacher.teacherId,
      name: teacher.name,
      role: "teacher",
      subdomain: teacher.subdomain,
    };
  }

  private async validateLocalStudent(email: string, password: string) {
    const student = await this.usersService.findStudentByEmail(email);
    if (!student) throw new UnauthorizedException("User not found!");

    const passwordMatched = await verify(student.passwordHash, password);
    if (!passwordMatched)
      throw new UnauthorizedException("Invalid credentials");

    return {
      id: student.id,
      name: student.name,
      role: "student",
    };
  }

  async login(userId: number, name: string, role: Role, subdomain?: string) {
    // Handle student login
    if (role === "student" && subdomain) {
      console.log("userId", userId);
      if (!subdomain) throw new BadRequestException("Subdomain is required");

      const teacher = await db.query.teachers.findFirst({
        where: eq(teachers.subdomain, subdomain),
      });
      if (!teacher) throw new BadRequestException("Subdomain not found");

      const student = await this.usersService.findUser(userId, "student");
      if (!student) throw new UnauthorizedException("User not found!");

      if (teacher.teacherId !== student.teacherId)
        throw new UnauthorizedException("Invalid credentials");
    }

    const { accessToken, refreshToken } = await this.generateTokens(
      userId,
      role
    );

    const hashedRT = await hash(refreshToken);
    await this.usersService.updateHashedRefreshToken(userId, role, hashedRT);

    return {
      id: userId,
      name: name,
      role,
      subdomain,
      accessToken,
      refreshToken,
    };
  }

  async generateTokens(userId: number, role: Role) {
    const payload: JwtPayload = { sub: userId, role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, this.refreshTokenConfig),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async registerTeacher(dto: CreateTeacherDto) {
    const exists = await this.usersService.findTeacherByEmail(dto.email);
    if (exists) throw new ConflictException("Email already exists");
    return this.usersService.createTeacher(dto);
  }

  async registerStudent(dto: CreateStudentDto) {
    const exists = await this.usersService.findStudentByEmail(dto.email);
    if (exists) throw new ConflictException("Email already exists");
    return this.usersService.createStudent(dto);
  }

  async validateJwtUser(userId: number, role: Role) {
    if (role === "teacher") return this.validateJwtTeacher(userId);
    else return this.validateJwtStudent(userId);
  }

  async validateJwtTeacher(teacherId: number) {
    const user = await this.usersService.findUser(teacherId, "teacher");
    if (!user) throw new UnauthorizedException("User not found!");

    const currentUser = {
      id: user.teacherId,
      name: user.name,
      role: "teacher",
    };
    return currentUser;
  }

  async validateJwtStudent(id: number) {
    const user = await this.usersService.findUser(id, "student");
    if (!user) throw new UnauthorizedException("User not found!");

    const currentUser = {
      id: (user as SelectStudent).id,
      name: user.name,
      role: "student",
    };
    return currentUser;
  }

  async validateRefreshToken(userId: number, refreshToken: string, role: Role) {
    let user: SelectTeacher | SelectStudent;
    if (role === "teacher")
      user = (await this.usersService.findUser(
        userId,
        "teacher"
      )) as SelectTeacher;
    else
      user = (await this.usersService.findUser(
        userId,
        "student"
      )) as SelectStudent;

    if (!user) throw new UnauthorizedException("User not found!");

    if (!refreshToken || !user.hashedRefreshToken)
      throw new UnauthorizedException("Invalid refresh token!");

    const refreshTokenMatched = await verify(
      user.hashedRefreshToken,
      refreshToken
    );
    if (!refreshTokenMatched)
      throw new UnauthorizedException("Invalid refresh token!");

    const currentUser = {
      id: role === "teacher" ? user.teacherId : (user as SelectStudent).id,
      name: user.name,
      role,
    };
    return currentUser;
  }

  async refreshToken(userId: number, name: string, role: Role) {
    const { accessToken, refreshToken } = await this.generateTokens(
      userId,
      role
    );

    const hashedRT = await hash(refreshToken);
    await this.usersService.updateHashedRefreshToken(userId, role, hashedRT);

    return {
      id: userId,
      name: name,
      accessToken,
      refreshToken,
    };
  }

  async logout(userId: any, role: Role) {
    return await this.usersService.updateHashedRefreshToken(userId, role, null);
  }
}
