import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PessoaFisica } from '../../entities/pessoa-fisica.entity'
import { PFService } from './pf.service'
import { PFController } from './pf.controller'

@Module({
  imports: [TypeOrmModule.forFeature([PessoaFisica])],
  providers: [PFService],
  controllers: [PFController],
})
export class PFModule {}