export const orderStatuses = [
  { value: "بانتظار التحويل", label: "بانتظار التحويل", messageLabel: "رسالة طلب التحويل", className: "bg-amber-50 text-amber-800 border-amber-200" },
  { value: "تم التحويل", label: "تم التحويل", messageLabel: "رسالة تأكيد التحويل", className: "bg-blue-50 text-blue-800 border-blue-200" },
  { value: "تم التسليم", label: "تم التسليم", messageLabel: "رسالة تسليم الطلب", className: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  { value: "ملغي", label: "ملغي", messageLabel: "رسالة إلغاء الطلب", className: "bg-red-50 text-red-800 border-red-200" },
  { value: "استرجاع الطلب", label: "استرجاع الطلب", messageLabel: "رسالة استرجاع الطلب", className: "bg-purple-50 text-purple-800 border-purple-200" },
] as const;

export type OrderStatus = (typeof orderStatuses)[number]["value"];
export type OrderStatusUpdate = { status: OrderStatus; paymentStatus: string };
export type WorkflowOrder = {
  id: string;
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  isGift?: boolean;
  customer?: { name?: string; phone?: string };
  customerName?: string;
  name?: string;
  phone?: string;
  total?: number;
};

// Keep old preparation/shipping states visible; they do not prove payment.
const aliases: Record<string, string> = {
  pending: "بانتظار التحويل", "جديد": "بانتظار التحويل", "قيد المراجعة": "بانتظار التحويل",
  "بانتظار تأكيد التحويل": "بانتظار التحويل", awaiting_transfer: "بانتظار التحويل",
  paid: "تم التحويل", "مدفوع": "تم التحويل",
  delivered: "تم التسليم", "تم التوصيل": "تم التسليم", "مكتمل": "تم التسليم",
  cancelled: "ملغي", "ملغي الطلب": "ملغي",
  returned: "استرجاع الطلب", "مرتجع": "استرجاع الطلب",
  confirmed: "تم التأكيد", processing: "قيد التجهيز", "جاري التجهيز": "قيد التجهيز", shipped: "تم الشحن",
};

export function normalizeOrderStatus(status?: string): string {
  const value = status?.trim() || "بانتظار التحويل";
  return aliases[value] || value;
}

export function isOrderStatus(status: string): status is OrderStatus {
  return orderStatuses.some((item) => item.value === status);
}

export function getOrderStatus(status?: string) {
  const value = normalizeOrderStatus(status);
  return orderStatuses.find((item) => item.value === value) || {
    value, label: value, messageLabel: "رسالة حالة الطلب", className: "bg-gray-50 text-gray-700 border-gray-200",
  };
}

export function planOrderStatusUpdate(
  order: Pick<WorkflowOrder, "status" | "paymentStatus" | "paymentMethod" | "isGift">,
  nextStatus: string,
  paymentConfirmed = false,
): OrderStatusUpdate {
  if (!isOrderStatus(nextStatus)) throw new Error("حالة الطلب غير صحيحة.");
  const current = normalizeOrderStatus(order.status);
  let paymentStatus = order.paymentStatus || "غير مدفوع";
  if (nextStatus === "تم التحويل") {
    if (!paymentConfirmed) throw new Error("أكد وصول كامل المبلغ إلى حساب المتجر أولًا.");
    if (["تم التسليم", "ملغي", "استرجاع الطلب"].includes(current)) {
      throw new Error("لا يمكن تأكيد تحويل طلب تم تسليمه أو إلغاؤه أو استرجاعه.");
    }
    paymentStatus = "مدفوع";
  }
  if (nextStatus === "بانتظار التحويل") {
    if (["تم التسليم", "ملغي", "استرجاع الطلب"].includes(current)) {
      throw new Error("لا يمكن طلب تحويل جديد لطلب تم تسليمه أو إلغاؤه أو استرجاعه.");
    }
    if (paymentStatus === "مدفوع" || current === "تم التحويل") {
      throw new Error("تم تأكيد الدفع لهذا الطلب؛ لا يمكن طلب التحويل مرة أخرى.");
    }
    paymentStatus = "بانتظار تأكيد التحويل";
  }
  if (nextStatus === "تم التسليم" && (order.isGift || order.paymentMethod === "تحويل مسبق") && paymentStatus !== "مدفوع") {
    throw new Error("أكد وصول التحويل أولًا قبل تسجيل تسليم الطلب.");
  }
  // Cancellation/return does not imply a refund. Preserve the payment record.
  return { status: nextStatus, paymentStatus };
}

export type MessageSettings = { name?: string; transferPhone?: string; whatsappMessage?: string };

export function buildOrderMessage(order: WorkflowOrder, settings: MessageSettings = {}): string {
  const status = normalizeOrderStatus(order.status);
  const name = order.customer?.name || order.customerName || order.name || "عميل همّار";
  const store = settings.name?.trim() || "همّار للعطور";
  const total = Number(order.total || 0).toFixed(3);
  const greeting = `السلام عليكم ${name}،\n\n${store}\nرقم الطلب: #${order.id}`;
  switch (status) {
    case "بانتظار التحويل": {
      if (order.paymentStatus === "مدفوع") throw new Error("تم دفع هذا الطلب؛ حدّث حالته قبل طلب التحويل.");
      const phone = settings.transferPhone?.trim();
      if (!phone) throw new Error("أضف رقم التحويل في إعدادات المتجر لعرض رسالة طلب التحويل.");
      const values: Record<string, string> = { name, orderId: order.id, total, transferPhone: phone };
      const message = settings.whatsappMessage?.trim()
        ? settings.whatsappMessage.replace(/\{(name|orderId|total|transferPhone)\}/g, (_, key: string) => values[key])
        : `${greeting}\n\nاستلمنا طلبك، وشكرًا لاختيارك لنا.\nلتأكيد الطلب، يرجى تحويل ${total} ر.ع إلى الرقم: ${phone}\nثم أرسل إيصال التحويل هنا عبر واتساب لنؤكد وصول المبلغ.`;
      return message + (order.isGift ? "\n\nهذه هدية؛ الدفع والتأكيد معك فقط، ولن يُطلب من المستلم دفع أي مبلغ." : "");
    }
    case "تم التحويل":
      if (order.paymentStatus !== "مدفوع") throw new Error("أكد وصول التحويل قبل فتح رسالة تأكيد الدفع.");
      return `${greeting}\n\nتم تأكيد وصول تحويلك بمبلغ ${total} ر.ع بنجاح.\nتم تأكيد طلبك، وسنتواصل معك لتنسيق التوصيل.\nشكرًا لثقتك بنا.`;
    case "تم التسليم":
      return `${greeting}\n\n${order.isGift ? "تم تسليم هديتك للمستلم بنجاح." : "تم تسليم طلبك بنجاح."}\nنتمنى أن تنال عطورنا إعجابك، ويسعدنا سماع رأيك.\nشكرًا لاختيارك لنا.`;
    case "ملغي":
      return `${greeting}\n\nتم إلغاء طلبك.${order.paymentStatus === "مدفوع" ? "\nسنتواصل معك بخصوص المبلغ المدفوع وإجراءات إعادته." : ""}\nلأي استفسار، يمكنك الرد على هذه الرسالة.`;
    case "استرجاع الطلب":
      return `${greeting}\n\nتم تسجيل استرجاع طلبك، وسنتواصل معك لتنسيق استلام المنتجات ومراجعة إجراءات الاسترجاع.${order.paymentStatus === "مدفوع" ? "\nسنبلغك بتفاصيل إعادة المبلغ بعد مراجعة الاسترجاع." : ""}\nشكرًا لتواصلك معنا.`;
    default:
      return `${greeting}\n\nحالة طلبك الحالية: ${status}.\nسنتواصل معك بخصوص توصيل طلبك.`;
  }
}
