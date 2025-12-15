import { Controller, Get, Req } from "@nestjs/common";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('/current-user')
  findCurrentUser(@Req() req) {
    return this.usersService.findUser(req.user.id, req.user.role);
  }
}
