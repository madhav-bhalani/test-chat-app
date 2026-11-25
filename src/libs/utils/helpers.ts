import * as crypto from 'node:crypto';

/**
 * Check if a value is not empty
 */
export function isNotEmpty(value: any): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  if (typeof value === 'number') {
    return !isNaN(value);
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  if (typeof value === 'object') {
    return Object.keys(value).length > 0;
  }
  return Boolean(value);
}

/**
 * Generate a slug from a string
 */
export async function generateSlug(text: string): Promise<string> {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars
    .replace(/[\s_-]+/g, '_') // Replace spaces, underscores, hyphens with single underscore
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate a random token
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash a string using SHA256
 */
export function hashString(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return `${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;
}

/**
 * Mask email for privacy
 */
export function maskEmail(email: string): string {
  const [username, domain] = email.split('@');
  if (username.length <= 2) {
    return `${username[0]}***@${domain}`;
  }
  const visiblePart = username.slice(0, 2);
  const maskedPart = '*'.repeat(Math.min(username.length - 2, 5));
  return `${visiblePart}${maskedPart}@${domain}`;
}

/**
 * Mask phone number for privacy
 */
export function maskPhone(phone: string): string {
  if (phone.length <= 4) {
    return phone;
  }
  const lastFour = phone.slice(-4);
  const masked = '*'.repeat(phone.length - 4);
  return `${masked}${lastFour}`;
}

/**
 * Check if string is a valid email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&#x27;')
    .replaceAll('/', '&#x2F;');
}

/**
 * Parse user agent to extract browser and OS info
 */
export function parseUserAgent(userAgent: string): {
  browserName: string;
  browserVersion: string;
  os: string;
} {
  let browserName = 'Unknown';
  let browserVersion = 'Unknown';
  let os = 'Unknown';

  // Detect browser
  if (userAgent.includes('Chrome')) {
    browserName = 'Chrome';
    const match = userAgent.match(/Chrome\/(\d+\.\d+)/);
    if (match) browserVersion = match[1];
  } else if (userAgent.includes('Firefox')) {
    browserName = 'Firefox';
    const match = userAgent.match(/Firefox\/(\d+\.\d+)/);
    if (match) browserVersion = match[1];
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browserName = 'Safari';
    const match = userAgent.match(/Version\/(\d+\.\d+)/);
    if (match) browserVersion = match[1];
  } else if (userAgent.includes('Edge')) {
    browserName = 'Edge';
    const match = userAgent.match(/Edge\/(\d+\.\d+)/);
    if (match) browserVersion = match[1];
  }

  // Detect OS
  if (userAgent.includes('Windows')) {
    os = 'Windows';
  } else if (userAgent.includes('Mac OS')) {
    os = 'macOS';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
  } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    os = 'iOS';
  }

  return { browserName, browserVersion, os };
}
