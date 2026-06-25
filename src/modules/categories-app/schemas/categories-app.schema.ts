import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CategoriesAppDocument = HydratedDocument<CategoriesApp>;

@Schema({ _id: false })
export class CategoryActivity {
  @Prop({ required: true })
  id!: string;

  @Prop({ required: true, trim: true })
  label!: string;

  @Prop({ default: true })
  active!: boolean;
}

@Schema({ timestamps: true, collection: 'categories_app' })
export class CategoriesApp {
  /** Slug estable: compromisos, pendientes, rutinas… */
  @Prop({ required: true, unique: true, index: true })
  categoryId!: string;

  @Prop({ required: true, trim: true })
  label!: string;

  @Prop({ required: true })
  color!: string;

  @Prop({ default: '' })
  description!: string;

  @Prop({ default: 1 })
  selectionMin!: number;

  @Prop({ default: 2 })
  selectionMax!: number;

  @Prop({ default: 1 })
  manageMin!: number;

  @Prop({ default: 6 })
  manageMax!: number;

  @Prop({ default: 2 })
  manageWeight!: number;

  @Prop({ type: [CategoryActivity], default: [] })
  activities!: CategoryActivity[];

  @Prop({ default: 0 })
  sortOrder!: number;

  @Prop({ default: true })
  active!: boolean;
}

export const CategoriesAppSchema = SchemaFactory.createForClass(CategoriesApp);
