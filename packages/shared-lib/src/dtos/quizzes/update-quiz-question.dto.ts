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

export class UpdateQuizAnswerDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  answerText?: string;

  @IsBoolean()
  @IsOptional()
  isCorrect?: boolean;
}

export class UpdateQuizQuestionDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  questionText?: string;

  // Allow updating question type between "mcq" and "true_false" only.
  // We keep the same restriction as in creation and never support
  // "short_answer" style questions in this module.
  @IsString()
  @IsOptional()
  @IsIn(["mcq", "true_false", "essay"])
  questionType?: "mcq" | "true_false" | "essay";

  @IsNumber()
  @IsOptional()
  @Min(0)
  orderIndex?: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  answers?: UpdateQuizAnswerDto[];
}
