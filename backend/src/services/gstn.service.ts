/**
 * GSTN Verification Service
 * Uses GSTVerify.co.in API for live verification.
 * Falls back to checksum-only validation if API is unavailable.
 */

export interface GSTNVerificationResult {
  valid: boolean;
  legalName?: string;
  tradeName?: string;
  status?: string;       // 'Active' | 'Cancelled' | 'Suspended'
  taxpayerType?: string;
  registrationDate?: string;
  address?: string;
  source: 'live' | 'checksum_only';
  error?: string;
}

// Checksum validation per GST spec
function validateGSTNChecksum(gstn: string): boolean {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstn)) {
    return false;
  }
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const val = chars.indexOf(gstn[i]);
    const factor = i % 2 === 0 ? 1 : 2;
    const product = val * factor;
    sum += Math.floor(product / 36) + (product % 36);
  }
  const checkDigit = chars[(36 - (sum % 36)) % 36];
  return checkDigit === gstn[14];
}

export async function verifyGSTN(
  gstn: string,
  apiKey?: string
): Promise<GSTNVerificationResult> {
  const upper = gstn.toUpperCase().trim();

  // Step 1: Checksum validation first (free, no API call)
  if (!validateGSTNChecksum(upper)) {
    return { valid: false, source: 'checksum_only', error: 'Invalid GSTN format or checksum.' };
  }

  // Step 2: Live API verification if API key provided
  if (apiKey) {
    try {
      const url = `https://sheet.gstincheck.co.in/check/${apiKey}/${upper}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data: any = await res.json();
        if (data.flag === true || data.data) {
          const d = data.data || data;
          return {
            valid: true,
            legalName: d.lgnm || d.legal_name,
            tradeName: d.tradeNam || d.trade_name,
            status: d.sts || d.status,
            taxpayerType: d.dty || d.taxpayer_type,
            registrationDate: d.rgdt || d.registration_date,
            address: d.pradr?.adr || d.address,
            source: 'live',
          };
        }
        return { valid: false, source: 'live', error: 'GSTN not found in government records.' };
      }
    } catch (err) {
      // API unavailable — fall through to checksum-only
      console.warn('GSTN live API unavailable, falling back to checksum:', err);
    }
  }

  // Step 3: Checksum passed, no live verification available
  return {
    valid: true,
    source: 'checksum_only',
  };
}

export default { verifyGSTN };
