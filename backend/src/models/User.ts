export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  created_at: Date;
}

export interface UserCreateInput {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface UserLoginInput {
  username: string;
  password: string;
}

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  created_at: Date;
}
