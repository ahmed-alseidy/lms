// @ts-nocheck
import { IsNotEmpty, IsNumber, IsPositive } from "class-validator";

export class StartQuizDto {
  @IsNotEmpty()
  @IsPositive()
  @IsNumber()
  enrollmentId: number;
}
