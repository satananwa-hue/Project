import { createHmac } from 'crypto';

// Phone numbers are low-entropy (E.164 numbers are brute-forceable), so a plain
// hash would let anyone rebuild a lookup table. HMAC with a server-side secret
// pepper prevents that while still giving us a stable, indexable identifier.
export function hashPhone(phone: string, secret: string): string {
  return createHmac('sha256', secret).update(phone).digest('hex');
}
