import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  CategoriesApp,
  CategoriesAppDocument,
} from './schemas/categories-app.schema';

@Injectable()
export class CategoriesAppService {
  constructor(
    @InjectModel(CategoriesApp.name)
    private readonly categoriesModel: Model<CategoriesAppDocument>,
  ) {}

  count(): Promise<number> {
    return this.categoriesModel.countDocuments().exec();
  }

  findAllActive(): Promise<CategoriesAppDocument[]> {
    return this.categoriesModel
      .find({ active: true })
      .sort({ sortOrder: 1 })
      .exec();
  }
}
