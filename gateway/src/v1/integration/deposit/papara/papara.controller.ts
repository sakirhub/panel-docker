import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { PaparaService } from './papara.service';
import { CreatePaparaDto } from './create-papara.dto';
@Controller('/v1/integration/deposit/papara')
export class PaparaController {
  constructor(private readonly bankTransferService: PaparaService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async createBankTransfer(@Body() createPaparaDto: CreatePaparaDto) {
    return this.bankTransferService.createBankTransfer(createPaparaDto);
  }
}
