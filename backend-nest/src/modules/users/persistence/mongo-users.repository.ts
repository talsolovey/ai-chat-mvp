import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../user.entity';
import { UsersRepository } from '../users.repository';
import { UserDocument, UserHydratedDocument } from './user.schema';

@Injectable()
export class MongoUsersRepository extends UsersRepository {
  constructor(
    @InjectModel('User')
    private readonly userModel: Model<UserDocument>,
  ) {
    super();
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const doc = await this.userModel.findOne({ email }).exec();
    return doc ? this.toEntity(doc) : undefined;
  }

  async findById(id: string): Promise<User | undefined> {
    if (!Types.ObjectId.isValid(id)) {
      return undefined;
    }
    const doc = await this.userModel.findById(id).exec();
    return doc ? this.toEntity(doc) : undefined;
  }

  async create(input: Omit<User, 'id'>): Promise<User> {
    const doc = await this.userModel.create({
      email: input.email,
      name: input.name,
      hashedPassword: input.hashedPassword,
    });
    return this.toEntity(doc);
  }

  private toEntity(doc: UserHydratedDocument): User {
    return {
      id: String(doc._id),
      email: doc.email,
      name: doc.name,
      hashedPassword: doc.hashedPassword,
    };
  }
}
