import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../user.entity';
import { UsersRepository } from '../users.repository';
import { UserDocument } from './user.schema';

@Injectable()
export class MongoUsersRepository extends UsersRepository {
  constructor(
    @InjectModel('User')
    private readonly userModel: Model<UserDocument>,
  ) {
    super();
  }

  findByEmail(email: string): Promise<User | undefined> {
    return this.userModel
      .findOne({ email })
      .lean()
      .exec()
      .then((userDoc) => (userDoc ? this.toUserEntity(userDoc) : undefined));
  }

  async findById(id: string): Promise<User | undefined> {
    if (!Types.ObjectId.isValid(id)) {
      return undefined;
    }
    const userDoc = await this.userModel.findById(id).lean().exec();
    return userDoc ? this.toUserEntity(userDoc) : undefined;
  }

  create(input: Omit<User, 'id'>): Promise<User> {
    return this.userModel
      .create({
        email: input.email,
        name: input.name,
        hashedPassword: input.hashedPassword,
      })
      .then((userDoc) => this.toUserEntity(userDoc));
  }

  private toUserEntity(userDoc: UserDocument & { _id: Types.ObjectId }): User {
    return {
      id: String(userDoc._id),
      email: userDoc.email,
      name: userDoc.name,
      hashedPassword: userDoc.hashedPassword,
    };
  }
}
