export function normalizeWhatsAppPhone(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  let phone = String(value)
    .trim()
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x6f0))
    .replace(/[\s()+\-\u200e\u200f\u061c]/g, "");

  if (!/^\d+$/.test(phone)) return null;
  if (phone.startsWith("00")) phone = phone.slice(2);
  if (/^0[79]\d{7}$/.test(phone)) phone = phone.slice(1);
  if (/^[79]\d{7}$/.test(phone)) phone = "968" + phone;

  if (phone.startsWith("968")) {
    return /^968[79]\d{7}$/.test(phone) ? phone : null;
  }
  return /^[1-9]\d{8,14}$/.test(phone) ? phone : null;
}

export function buildWhatsAppUrl(phone: string, message: string, mobile: boolean) {
  return mobile
    ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    : `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
}
