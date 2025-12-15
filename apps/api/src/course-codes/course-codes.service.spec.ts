import { Test, TestingModule } from "@nestjs/testing";
import { CourseCodesService } from "./course-codes.service";

describe("CourseCodesService", () => {
  let service: CourseCodesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CourseCodesService],
    }).compile();

    service = module.get<CourseCodesService>(CourseCodesService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
