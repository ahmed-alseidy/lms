import { Controller, Get, Query, Req } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { Session, UserSession } from "@thallesp/nestjs-better-auth";
import { AnalyticsService } from "./analytics.service";

@ApiBearerAuth()
@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("students")
  async getStudents(
    @Session() session: UserSession,
    @Query('page') page: number,
    @Query('limit') limit: number
  ) {
    return this.analyticsService.getStudents(session.user.id, page, limit);
  }

  @Get('overview')
  async getOverview(@Session() session: UserSession) {
    return this.analyticsService.getOverview(session.user.id);
  }

  @Get("monthly")
  async getMonthlyData(@Session() session: UserSession, @Query('period') period: number) {
    return this.analyticsService.getMonthlyData(session.user.id, period);
  }

  @Get("top-courses")
  async getTopCourses(@Session() session: UserSession, @Query('limit') limit: number) {
    return this.analyticsService.getTopCourses(session.user.id, limit);
  }

  @Get("activity")
  async getRecentActivities(@Session() session: UserSession, @Query('limit') limit: number) {
    return this.analyticsService.getRecentActivities(session.user.id, limit);
  }

  @Get("revenue/breakdown")
  async getRevenueBreakdown(@Session() session: UserSession, @Query('month') month: number) {
    return this.analyticsService.getRevenueBreakdown(session.user.id, month);
  }
}
