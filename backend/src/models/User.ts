export interface User {
  id: number;
  username: string;
  mobile_number?: string;
  email: string;
  password_hash?: string;
  first_name?: string;
  last_name?: string;
  email_verified: boolean;
  email_verification_token?: string;
  email_verification_expires?: Date;
  password_reset_token?: string;
  password_reset_expires?: Date;
  email_otp?: string;
  email_otp_expires?: Date;
  created_at: Date;
}

export interface UserCreateInput {
  username: string;
  mobile_number: string;
  email: string;
  password?: string;
  first_name?: string;
  last_name?: string;
}

export interface UserLoginInput {
  username: string;
  password: string;
}

export interface EmailOTPLoginInput {
  email: string;
  otp: string;
}

export interface UserResponse {
  id: number;
  username: string;
  mobile_number?: string;
  email: string;
  first_name?: string;
  last_name?: string;
  email_verified: boolean;
  created_at: Date;
}
