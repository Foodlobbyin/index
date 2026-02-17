export interface User {
  id: number;
  username: string;
  mobile_number?: string;
  phone_number?: string;
  email: string;
  password_hash?: string;
  first_name?: string;
  last_name?: string;
  gstn?: string;
  email_verified: boolean;
  account_activated: boolean;
  email_verification_token?: string;
  email_verification_expires?: Date;
  password_reset_token?: string;
  password_reset_expires?: Date;
  email_otp?: string;
  email_otp_expires?: Date;
  otp_generation_count: number;
  otp_verification_count: number;
  otp_last_generated_at?: Date;
  otp_last_verified_at?: Date;
  created_at: Date;
}

export interface UserCreateInput {
  username: string;
  mobile_number?: string;
  phone_number: string;
  email: string;
  password: string;
  confirm_password: string;
  first_name?: string;
  last_name?: string;
  gstn: string;
  referral_code: string;
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
  phone_number?: string;
  email: string;
  first_name?: string;
  last_name?: string;
  gstn?: string;
  email_verified: boolean;
  account_activated: boolean;
  created_at: Date;
}

export interface VerifyOTPInput {
  email: string;
  otp: string;
  captcha_token?: string;
}
