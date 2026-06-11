export type UserId = string;

export type User = {
  id: UserId;
  email: string;
  name: string;
  hashedPassword: string;
};

export type PublicUser = Omit<User, 'hashedPassword'>;
