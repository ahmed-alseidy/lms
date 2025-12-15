import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";

class UpdateLessonOrderDto {
  @IsNumber()
  @IsOptional()
  id?: number;

  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  orderIndex?: number;
}

export class UpdateCourseSectionDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  @IsOptional()
  title?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  orderIndex?: number;

  @IsArray()
  @ValidateNested({ each: true })
  // @Type(() => UpdateLessonOrderDto)
  @IsOptional()
  lessons?: UpdateLessonOrderDto[];
}
