import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './create-organization.dto';
import { UpdateOrganizationDto } from './update-organization.dto';
import { UpdateOrganizationApikeyDto } from './update-organization-apikey.dto';
import { DeleteOrganizationDto } from './delete-organization.dto';

@Controller('admin/organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}
  @Get()
  async findAll(@Query() queryParams: string) {
    return this.organizationsService.findAll(queryParams);
  }

  @Post()
  async createOrganization(
    @Body() createOrganizationDto: CreateOrganizationDto,
  ) {
    return this.organizationsService.createOrganization(createOrganizationDto);
  }

  @Post('update')
  async updateOrganization(
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.updateOrganization(updateOrganizationDto);
  }

  @Post('update/status')
  async updateOrganizationStatus(
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.updateOrganizationStatus(
      updateOrganizationDto,
    );
  }

  @Post('update/apikey')
  async updateOrganizationApikey(
    @Body() updateOrganizationApikeyDto: UpdateOrganizationApikeyDto,
  ) {
    return this.organizationsService.updateOrganizationApikey(
      updateOrganizationApikeyDto,
    );
  }

  @Post('delete')
  async deleteOrganization(
    @Body() deleteOrganizationDto: DeleteOrganizationDto,
  ) {
    return this.organizationsService.deleteOrganization(deleteOrganizationDto);
  }
}
