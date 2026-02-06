// @ts-nocheck

import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";

export class CreateQuizAnswerDto {
  @IsString()
  @MinLength(1)
  answerText: string;

  @IsBoolean()
  isCorrect: boolean;
}

export class CreateQuizQuestionDto {
  @IsString()
  @MinLength(1)
  questionText: string;

  // Only multiple-choice and true/false questions are allowed. We explicitly
  // disallow any "short_answer" style type in order to keep the quiz module
  // fully auto-gradable.
  @IsString()
  @IsIn(["mcq", "true_false", "essay"])
  questionType: "mcq" | "true_false" | "essay";

  @IsNumber()
  @Min(0)
  orderIndex: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateQuizAnswerDto)
  answers?: CreateQuizAnswerDto[];
}
