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
import { UpdateVideoDto } from "../videos/update-video.dto";

export class UpdateLessonDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(255)
  title?: string;

  @IsString()
  @IsOptional()
  @MinLength(3)
  description?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  orderIndex?: number;

  @IsArray()
  @ValidateNested({ each: true })
  // @Type(() => UpdateVideoDto)
  @IsOptional()
  videos?: UpdateVideoDto[];
}
