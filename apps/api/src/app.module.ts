import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PassportModule } from "@nestjs/passport";
import { AnalyticsModule } from "./analytics/analytics.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { CourseCodesModule } from "./course-codes/course-codes.module";
import { CoursesModule } from "./courses/courses.module";
import { LessonsModule } from "./lessons/lessons.module";
import { PaymentsModule } from "./payments/payments.module";
import { QuizzesModule } from "./quizzes/quizzes.module";
import { S3Module } from "./s3/s3.module";
import { UsersModule } from "./users/users.module";
import { VideosModule } from "./videos/videos.module";

@Module({
  imports: [
    UsersModule,
    AuthModule,
    PassportModule,
    ConfigModule.forRoot({ isGlobal: true }),
    CoursesModule,
    S3Module,
    VideosModule,
    LessonsModule,
    QuizzesModule,
    CourseCodesModule,
    AnalyticsModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
