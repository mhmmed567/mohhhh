export type GiftDetails = {
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  message: string;
  hideSender: boolean;
};

export function giftDeliveryMessage(gift: GiftDetails, senderName: string) {
  return [
    "همّار | HAMMAR",
    `السلام عليكم ${gift.recipientName}،\nلك هدية من شخص اختار يسعدك، واختار همّار لتوصيلها لك 🤍`,
    gift.hideSender ? "" : `الهدية من: ${senderName}`,
    "أرسل لنا اللوكيشن عشان نوصل لك هديتك 📍",
    "بعض المشاعر تُهدى ✨",
  ].filter(Boolean).join("\n\n");
}
