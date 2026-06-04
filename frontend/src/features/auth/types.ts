export type User = {
  id: string;
  name: string;
};

export type LoginRequest = {
  userId: string;
};

export type LoginResponse = {
  token: string;
  user: User;
};
