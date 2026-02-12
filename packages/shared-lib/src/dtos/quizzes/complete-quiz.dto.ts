// @ts-nocheck
import { Type } from "class-transformer";
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from "class-validator";

export class SubmittedAnswer {
  @IsNotEmpty()
  @IsPositive()
  @IsNumber()
  questionId: number;

  @IsOptional()
  @IsPositive()
  @IsNumber()
  answerId?: number;

  @IsOptional()
  @IsString()
  textAnswer?: string;
}

export class CompleteQuizDto {
  @IsNotEmpty()
  @IsPositive()
  @IsNumber()
  enrollmentId: number;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmittedAnswer)
  answers: SubmittedAnswer[];
}
