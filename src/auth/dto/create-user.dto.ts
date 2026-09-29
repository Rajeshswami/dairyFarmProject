import {
  IsEmail,
  IsEnum,
  IsString,
  MinLength,
} from 'class-validator';

import { UserRole } from '../schema/user.schema';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(UserRole)
  role: UserRole;
}