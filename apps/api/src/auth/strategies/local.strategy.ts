import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Request } from "express";
import { Strategy } from "passport-local";
import { AuthService } from "../auth.service";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: "email",
      passReqToCallback: true,
    });
  }

  async validate(req: Request, email: string, password: string) {
    if (password === "")
      throw new UnauthorizedException("Please provide your password!");
    const res = await this.authService.validateLocalUser(
      email,
      password,
      req.body.role
    );
    return res;
  }
}
