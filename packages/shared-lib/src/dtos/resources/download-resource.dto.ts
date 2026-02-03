// @ts-nocheck
import { IsNotEmpty, IsNumber, IsPositive, IsString } from "class-validator";

export class DownloadResourceDto {
  @IsNotEmpty()
  @IsPositive()
  @IsNumber()
  enrollmentId: number;

  @IsString()
  @IsNotEmpty()
  resourceType: "lesson" | "course";
}
