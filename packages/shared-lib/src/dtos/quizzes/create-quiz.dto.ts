// @ts-nocheck
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class CreateQuizDto {
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title: string;

  @IsNumber()
  @Min(1)
  duration: number;

  @IsBoolean()
  @IsOptional()
  allowMultipleAttempts?: boolean;
}
