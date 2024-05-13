import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './create-user.dto';
import { ChangePasswordUserDto } from './change-password-user.dto';
import { RemoveMfaUserDto } from './remove-mfa-user.dto';
@Controller('admin/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(@Query() queryParams: string) {
    return this.usersService.findAll(queryParams);
  }

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @Post('change-password')
  async changePassword(@Body() changePasswordDto: ChangePasswordUserDto) {
    return this.usersService.changePassword(changePasswordDto);
  }

  @Get('mfa/:user_id')
  async getMfa(@Param() params: any) {
    return this.usersService.mfaFactorList(params.user_id);
  }

  @Post('remove-mfa')
  async removeMfa(@Body() removeMfaUserDto: RemoveMfaUserDto) {
    return this.usersService.removeMfa(removeMfaUserDto);
  }
}
