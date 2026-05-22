const PERSONAL_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.in",
  "ymail.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "pm.me",
  "mail.com",
  "gmx.com",
  "gmx.net",
  "gmx.de",
  "rediffmail.com",
  "rediff.com",
  "zoho.com",
  "yandex.com",
  "yandex.ru",
  "hey.com",
  "tutanota.com",
  "tuta.com",
  "fastmail.com",
  "duck.com",
]);

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "10minutemail.com",
  "guerrillamail.com",
  "mailinator.com",
  "tempmail.com",
  "temp-mail.org",
  "throwawaymail.com",
  "yopmail.com",
]);

export const WORK_EMAIL_ERROR = "Please use your work email, for example you@company.com.";

export function getEmailDomain(email: string) {
  const [, domain = ""] = email.trim().toLowerCase().split("@");
  return domain;
}

export function isWorkEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return false;

  const domain = getEmailDomain(normalizedEmail);
  if (!domain) return false;
  if (PERSONAL_EMAIL_DOMAINS.has(domain)) return false;
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) return false;

  return true;
}
