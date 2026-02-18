export interface Referral {
  id: number;
  code: string;
  created_by_user_id: number;
  max_uses: number;
  used_count: number;
  expires_at?: Date;
  allowed_email_domain?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ReferralCreateInput {
  created_by_user_id: number;
  max_uses?: number;
  expires_at?: Date;
  allowed_email_domain?: string;
}

export interface ReferralValidationResult {
  isValid: boolean;
  referral?: Referral;
  error?: string;
}
