// @ts-nocheck
import { IsNotEmpty, IsNumber, IsPositive } from "class-validator";

export class ResumeQuizDto {
  @IsNotEmpty()
  @IsPositive()
  @IsNumber()
  enrollmentId: number;
}
