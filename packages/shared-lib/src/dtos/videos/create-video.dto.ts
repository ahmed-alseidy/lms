import { IsNumber, IsString, MaxLength, Min, MinLength } from "class-validator";

export class CreateVideoDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;
}

export class CreateMuxVideoDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;
}
