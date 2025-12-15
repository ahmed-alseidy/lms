import { GenerateCodesDto, ValidateCodeDto } from "@lms-saas/shared-lib";
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { Roles } from "@/auth/decorators/roles.decorator";
import { RolesGuard } from "@/auth/guards/roles/roles.guard";
import { CourseCodesService } from "./course-codes.service";

@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller("courses/:courseId/course-codes")
export class CourseCodesController {
  constructor(private readonly courseCodesService: CourseCodesService) {}

  @Post("generate")
  @Roles("teacher")
  async generateCodes(
    @Body() dto: GenerateCodesDto,
    @Param('courseId', ParseIntPipe) courseId: number,
    @Req() req
  ) {
    return this.courseCodesService.generateCodes(
      courseId,
      dto.quantity,
      req.user.id
    );
  }

  @Post("validate")
  @Roles("student")
  async validateCode(
    @Body() dto: ValidateCodeDto,
    @Param('courseId', ParseIntPipe) courseId: number,
    @Req() req
  ) {
    return this.courseCodesService.validateAndUseCode(
      dto.code,
      courseId,
      req.user.id
    );
  }

  @Get()
  @Roles("teacher")
  async getCourseCodes(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Req() req
  ) {
    return this.courseCodesService.getCourseCodes(courseId, req.user.id);
  }
}
