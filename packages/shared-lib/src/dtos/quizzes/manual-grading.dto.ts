import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsNumber, ValidateNested } from "class-validator";

/**
 * One essay question grade: teacher marks the answer as correct or incorrect.
 */
export class EssayGradeItem {
  @IsNumber()
  questionId!: number;

  @IsBoolean()
  isCorrect!: boolean;
}

/**
 * DTO for teacher manual grading of a quiz submission.
 * Teacher marks each essay answer as correct or incorrect; final score is computed from
 * auto-graded (MCQ/true-false) correctness + these essay grades.
 */
export class ManualGradingDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EssayGradeItem)
  essayGrades!: EssayGradeItem[];
}
