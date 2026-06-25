import { Controller, Get } from '@nestjs/common';

import { CategoriesAppService } from './categories-app.service';
import { toCategoryResponse } from './categories-app.mapper';

@Controller('categories-app')
export class CategoriesAppController {
  constructor(private readonly categoriesAppService: CategoriesAppService) {}

  @Get()
  async findAll() {
    const categories = await this.categoriesAppService.findAllActive();
    return { categories: categories.map(toCategoryResponse) };
  }
}
