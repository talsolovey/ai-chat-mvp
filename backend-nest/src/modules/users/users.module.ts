import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { MongoUsersRepository } from './persistence/mongo-users.repository';
import { UserSchema } from './persistence/user.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'User', schema: UserSchema }])],
  providers: [
    UsersService,
    { provide: UsersRepository, useClass: MongoUsersRepository },
  ],
  exports: [UsersService],
})
export class UsersModule {}
