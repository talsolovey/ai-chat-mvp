import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class UserDocument {
  @Prop({ required: true })
  email!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  hashedPassword!: string;
}

export type UserHydratedDocument = HydratedDocument<UserDocument>;

export const UserSchema = SchemaFactory.createForClass(UserDocument);
UserSchema.index({ email: 1 }, { unique: true });
