import { Test, TestingModule } from "@nestjs/testing";
import { CourseCodesController } from "./course-codes.controller";
import { CourseCodesService } from "./course-codes.service";

describe("CourseCodesController", () => {
  let controller: CourseCodesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CourseCodesController],
      providers: [CourseCodesService],
    }).compile();

    controller = module.get<CourseCodesController>(CourseCodesController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
