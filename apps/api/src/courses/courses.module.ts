import { Module } from "@nestjs/common";
import { CloudinaryModule } from "@/cloudinary/cloudinary.module";
import { CoursesController } from "./courses.controller";
import { CoursesService } from "./courses.service";

@Module({
  imports: [CloudinaryModule],
  controllers: [CoursesController],
  providers: [CoursesService],
})
export class CoursesModule {}
