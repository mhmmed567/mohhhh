export type GiftDetails = {
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  message: string;
  hideSender: boolean;
};

export function giftDeliveryMessage(gift: GiftDetails, senderName: string) {
  return [
    `السلام عليكم ${gift.recipientName}، معك همّار للعطور.`,
    "لديك هدية مدفوعة بالكامل. نرغب في تنسيق موعد التوصيل المناسب لك.",
    gift.hideSender ? "" : `الهدية من: ${senderName}`,
    "لن يُطلب منك دفع أي مبلغ عند الاستلام.",
  ].filter(Boolean).join("\n");
}

export function giftStatusAllowed(isGift: boolean, paymentStatus: string, status: string) {
  return !isGift || paymentStatus === "مدفوع" ||
    ["جديد", "pending", "قيد المراجعة", "بانتظار تأكيد التحويل", "ملغي", "cancelled"].includes(status);
}
