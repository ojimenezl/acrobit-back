import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MessagesAppDocument = HydratedDocument<MessagesApp>;

@Schema({ timestamps: true, collection: 'messages_app' })
export class MessagesApp {
  /** Día del año 1–365 (popup diario). */
  @Prop({ required: true, unique: true, min: 1, max: 365, index: true })
  dayOfYear!: number;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, trim: true })
  message!: string;

  @Prop({ default: true })
  active!: boolean;
}

export const MessagesAppSchema = SchemaFactory.createForClass(MessagesApp);
