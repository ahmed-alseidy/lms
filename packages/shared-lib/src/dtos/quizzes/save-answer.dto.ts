// @ts-nocheck
import { IsNotEmpty, IsNumber, IsPositive } from "class-validator";

export class SaveAnswerDto {
  @IsNotEmpty()
  @IsPositive()
  @IsNumber()
  submissionId: number;

  @IsNotEmpty()
  @IsPositive()
  @IsNumber()
  questionId: number;

  @IsNotEmpty()
  @IsPositive()
  @IsNumber()
  answerId: number;
}
