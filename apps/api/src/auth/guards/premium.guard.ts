import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { UsersService } from "@/users/users.service";

@Injectable()
export class PremiumGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const user = context.switchToHttp().getRequest().user;
    const teacher = await this.usersService.getTeacherByAuthId(user.id);
    if (!teacher) throw new NotFoundException("Teacher not found");

    if (teacher.plan !== "premium") {
      throw new ForbiddenException("Premium plan required");
    }
    return true;
  }
}
