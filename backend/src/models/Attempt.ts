export interface RegistrationAttempt {
  id: number;
  email: string;
  phone_number?: string;
  ip_address: string;
  referral_code?: string;
  success: boolean;
  failure_reason?: string;
  user_agent?: string;
  created_at: Date;
}

export interface OTPAttempt {
  id: number;
  email: string;
  ip_address?: string;
  attempt_type: 'generation' | 'verification';
  success: boolean;
  created_at: Date;
}
