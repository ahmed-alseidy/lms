import { Module } from "@nestjs/common";
import { CourseCodesController } from "./course-codes.controller";
import { CourseCodesService } from "./course-codes.service";

@Module({
  controllers: [CourseCodesController],
  providers: [CourseCodesService],
})
export class CourseCodesModule {}
