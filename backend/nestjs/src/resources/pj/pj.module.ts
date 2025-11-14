import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PessoaJuridica } from '../../entities/pessoa-juridica.entity'
import { PJService } from './pj.service'
import { PJController } from './pj.controller'

@Module({
  imports: [TypeOrmModule.forFeature([PessoaJuridica])],
  providers: [PJService],
  controllers: [PJController],
})
export class PJModule {}