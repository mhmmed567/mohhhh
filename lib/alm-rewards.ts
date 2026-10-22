import { normalizeOrderStatus } from "./order-workflow";

export type AlmCampaign = {
  active: boolean;
  limit: number;
  chancePercent: number;
  rewardTitle: string;
  issuedCount: number;
  redeemedCount: number;
};

export const defaultAlmCampaign: AlmCampaign = {
  active: false,
  limit: 100,
  chancePercent: 20,
  rewardTitle: "مشروب ضيافة من ALM",
  issuedCount: 0,
  redeemedCount: 0,
};

export type AlmVoucher = {
  token: string;
  code: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  rewardTitle: string;
  status: "ready" | "used";
  issuedAt: string;
  usedAt: string | null;
};

export type AlmAllocation = {
  voucher: AlmVoucher | null;
  reason?:
    | "disabled"
    | "paused"
    | "unpaid"
    | "closed"
    | "not_selected"
    | "duplicate_customer"
    | "limit_reached";
};

export function isAlmToken(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

export function safeAlmReturnPath(value: string | null): string | null {
  return value && /^\/admin\/alm(?:\/redeem\/[a-f0-9]{64})?$/.test(value)
    ? value
    : null;
}

export function almOrderEligible(order: {
  status?: string;
  paymentStatus?: string;
}) {
  return (
    order.paymentStatus === "مدفوع" &&
    !["ملغي", "استرجاع الطلب"].includes(normalizeOrderStatus(order.status))
  );
}

export function almGiftUrl(token: string, origin: string) {
  if (!isAlmToken(token)) throw new Error("رمز الهدية غير صحيح.");
  return new URL("/alm/gift/" + token, origin).toString();
}

export function almRedeemPath(token: string) {
  if (!isAlmToken(token)) throw new Error("رمز الهدية غير صحيح.");
  return "/admin/alm/redeem/" + token;
}

export function almGiftMessage(
  voucher: Pick<AlmVoucher, "token" | "rewardTitle">,
  origin: string,
) {
  return (
    "\n\nهدية من همّار × ALM ☕\n" +
    voucher.rewardTitle +
    "\nافتح الرابط لعرض كود هديتك، وقدّمه في كوفي ALM:\n" +
    almGiftUrl(voucher.token, origin) +
    "\nالهدية تُصرف مرة واحدة بعد تأكيد المشرف."
  );
}
