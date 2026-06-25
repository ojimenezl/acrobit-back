import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  CategoriesApp,
  CategoriesAppSchema,
} from './schemas/categories-app.schema';
import { CategoriesAppController } from './categories-app.controller';
import { CategoriesAppService } from './categories-app.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CategoriesApp.name, schema: CategoriesAppSchema },
    ]),
  ],
  controllers: [CategoriesAppController],
  providers: [CategoriesAppService],
  exports: [CategoriesAppService, MongooseModule],
})
export class CategoriesAppModule {}
