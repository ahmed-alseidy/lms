import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";

export class UpdateQuizDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(255)
  title?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  duration?: number;

  @IsBoolean()
  @IsOptional()
  allowMultipleAttempts?: boolean;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  questions?: UpdateQuizQuestionDto[];
}

class UpdateQuizQuestionDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(255)
  questionText?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  orderIndex?: number;
}
