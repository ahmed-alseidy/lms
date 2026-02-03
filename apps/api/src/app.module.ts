import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PassportModule } from "@nestjs/passport";
import { AuthModule } from "@thallesp/nestjs-better-auth";
import { auth } from "@/lib/auth";
import { AnalyticsModule } from "./analytics/analytics.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { CourseCodesModule } from "./course-codes/course-codes.module";
import { CoursesModule } from "./courses/courses.module";
import { LessonsModule } from "./lessons/lessons.module";
import { PaymentsModule } from "./payments/payments.module";
import { QuizzesModule } from "./quizzes/quizzes.module";
import { ResourcesModule } from "./resources/resources.module";
import { S3Module } from "./s3/s3.module";
import { UsersModule } from "./users/users.module";
import { VideosModule } from "./videos/videos.module";

@Module({
  imports: [
    UsersModule,
    AuthModule.forRoot({
      auth,
    }),
    PassportModule,
    ConfigModule.forRoot({ isGlobal: true }),
    CoursesModule,
    S3Module,
    VideosModule,
    LessonsModule,
    QuizzesModule,
    ResourcesModule,
    CourseCodesModule,
    AnalyticsModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
