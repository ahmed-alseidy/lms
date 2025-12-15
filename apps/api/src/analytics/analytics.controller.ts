import { Controller, Get, Query, Req } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { AnalyticsService } from "./analytics.service";

@ApiBearerAuth()
@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("students")
  async getStudents(
    @Req() req,
    @Query('page') page: number,
    @Query('limit') limit: number
  ) {
    return this.analyticsService.getStudents(req.user.id, page, limit);
  }

  @Get('overview')
  async getOverview(@Req() req) {
    return this.analyticsService.getOverview(req.user.id);
  }

  @Get("monthly")
  async getMonthlyData(@Req() req, @Query('period') period: number) {
    return this.analyticsService.getMonthlyData(req.user.id, period);
  }

  @Get("top-courses")
  async getTopCourses(@Req() req, @Query('limit') limit: number) {
    return this.analyticsService.getTopCourses(req.user.id, limit);
  }

  @Get("activity")
  async getRecentActivities(@Req() req, @Query('limit') limit: number) {
    return this.analyticsService.getRecentActivities(req.user.id, limit);
  }

  @Get("revenue/breakdown")
  async getRevenueBreakdown(@Req() req, @Query('month') month: number) {
    return this.analyticsService.getRevenueBreakdown(req.user.id, month);
  }
}
