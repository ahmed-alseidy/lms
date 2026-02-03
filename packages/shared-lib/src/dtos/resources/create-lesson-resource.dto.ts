// @ts-nocheck
import { IsString, MaxLength, MinLength } from "class-validator";

export class CreateLessonResourceDto {
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title: string;

  @IsString()
  @MinLength(1)
  fileKey: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  fileName: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  fileType: string;

  @IsString()
  fileSize: string; // Will be converted to number
}
