import { IsString, IsOptional, IsEmail, IsNumberString, IsPhoneNumber, IsUrl, MinLength, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @MinLength(8, { message: 'NIM harus minimal 8 karakter' })
  @MaxLength(20, { message: 'NIM maksimal 20 karakter' })
  nim?: string;
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  @IsPhoneNumber('ID')
  phoneNumber?: string;

  @IsUrl()
  @IsOptional()
  avatar?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  province?: string;

  @IsNumberString()
  @IsOptional()
  postalCode?: string;

  @IsString()
  @IsOptional()
  country?: string;
}
