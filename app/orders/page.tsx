"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
collection,
deleteDoc,
doc,
getDocs,
orderBy,
query,
updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

import { auth, db } from "@/lib/firebase";
import { buildWhatsAppUrl, normalizeWhatsAppPhone } from "@/lib/whatsapp";

type OrderItem = {
preOrder?: boolean;
productId: string;
name: string;
description?: string;
price: number;
quantity: number;
image?: string;
};

type Order = {
id: string;
userId: string;

customer?: {
name?: string;
phone?: string;
address?: string;
notes?: string;
};

items: OrderItem[];

subtotal: number;
shippingPrice: number;
total: number;

status: string;

createdAt?: {
seconds: number;
nanoseconds: number;
} | null;
};

const statuses = [
"جديد",
"قيد التجهيز",
"تم الشحن",
"مكتمل",
"ملغي",
];

// غيّر هذا الرقم إلى رقم التحويل الخاص بك
// اكتب الرقم العماني بدون +968
const TRANSFER_PHONE = "XXXXXXXX";

export default function AdminOrdersPage() {
const router = useRouter();

const [orders, setOrders] = useState<Order[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [selectedOrder, setSelectedOrder] =
useState<Order | null>(null);

const [updatingId, setUpdatingId] = useState<string | null>(
null
);

useEffect(() => {
const unsubscribe = onAuthStateChanged(auth, async (user) => {
if (!user) {
router.replace("/login");
return;
}


  try {
    const token = await user.getIdTokenResult();

    if (
      token.claims.role !== "admin" &&
      token.claims.role !== "staff"
    ) {
      router.replace("/");
      return;
    }

    await loadOrders();
  } catch (err) {
    console.error(err);
    setError("تعذر التحقق من صلاحيات الحساب");
    setLoading(false);
  }
});

return () => unsubscribe();


}, [router]);

const loadOrders = async () => {
try {
setError("");


  const ordersQuery = query(
    collection(db, "orders"),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(ordersQuery);

  const realOrders: Order[] = snapshot.docs.map(
    (orderDoc) => {
      const data = orderDoc.data();

      return {
        id: orderDoc.id,
        userId: data.userId ?? "",
        customer: {
          name: data.customer?.name ?? data.name ?? "",
          phone: String(data.customer?.phone || data.phone || ""),
          address: data.customer?.address ?? data.address ?? "",
          notes: data.customer?.notes ?? data.notes ?? "",
        },
        items: Array.isArray(data.items)
          ? data.items
          : [],
        subtotal: Number(data.subtotal ?? 0),
        shippingPrice: Number(
          data.shippingPrice ?? 0
        ),
        total: Number(data.total ?? 0),
        status: data.status ?? "جديد",
        createdAt: data.createdAt ?? null,
      };
    }
  );

  setOrders(realOrders);
} catch (err) {
  console.error(err);
  setError(
    "تعذر تحميل الطلبات. تأكد من إعداد Firestore وقواعد الصلاحيات."
  );
} finally {
  setLoading(false);
}


};

const changeStatus = async (
orderId: string,
status: string
) => {
setUpdatingId(orderId);


try {
  await updateDoc(doc(db, "orders", orderId), {
    status,
    updatedAt: new Date(),
  });

  setOrders((current) =>
    current.map((order) =>
      order.id === orderId
        ? {
            ...order,
            status,
          }
        : order
    )
  );

  setSelectedOrder((current) =>
    current?.id === orderId
      ? {
          ...current,
          status,
        }
      : current
  );
} catch (err) {
  console.error(err);
  setError("تعذر تحديث حالة الطلب");
} finally {
  setUpdatingId(null);
}


};

const deleteOrder = async (orderId: string) => {
const confirmed = window.confirm(
"هل أنت متأكد من حذف هذا الطلب؟"
);


if (!confirmed) return;

try {
  await deleteDoc(doc(db, "orders", orderId));

  setOrders((current) =>
    current.filter((order) => order.id !== orderId)
  );

  if (selectedOrder?.id === orderId) {
    setSelectedOrder(null);
  }
} catch (err) {
  console.error(err);
  setError("تعذر حذف الطلب");
}


};

const formatDate = (
timestamp:
| {
seconds: number;
}
| null
| undefined
) => {
if (!timestamp?.seconds) {
return "غير معروف";
}


return new Intl.DateTimeFormat("ar-OM", {
  dateStyle: "medium",
  timeStyle: "short",
}).format(new Date(timestamp.seconds * 1000));


};

const statusClass = (status: string) => {
switch (status) {
case "جديد":
return "bg-blue-50 text-blue-600";


  case "قيد التجهيز":
    return "bg-amber-50 text-amber-600";

  case "تم الشحن":
    return "bg-purple-50 text-purple-600";

  case "مكتمل":
    return "bg-green-50 text-green-600";

  case "ملغي":
    return "bg-red-50 text-red-600";

  default:
    return "bg-black/5 text-black/60";
}


};

const openWhatsApp = (order: Order) => {
const customerName =
order.customer?.name || "عميل همار";


setError("");
const whatsappPhone = normalizeWhatsAppPhone(order.customer?.phone);

if (!whatsappPhone) {
  const errorMessage = "رقم العميل غير موجود أو غير صحيح. أدخل رقمًا عمانيًا من 8 أرقام أو رقمًا دوليًا مع مفتاح الدولة.";
  setError(errorMessage);
  window.alert(errorMessage);
  return;
}

const message = `السلام عليكم ${customerName}


تم استلام طلبك من همار للعطور

رقم الطلب: #${order.id}
قيمة الطلب: ${Number(order.total).toFixed(3)} ر.ع

لتأكيد طلبك يرجى تحويل مبلغ الطلب على الرقم التالي:
${92587656}

وبعد التحويل أرسل لنا إيصال الدفع هنا عبر الواتساب

وشكرًا لك
همار للعطور`;


const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const whatsappUrl = buildWhatsAppUrl(whatsappPhone, message, mobile);

// Navigation in this tab works even when the browser blocks pop-up windows.
window.location.assign(whatsappUrl);


};

if (loading) {
return ( <main
     dir="rtl"
     className="flex min-h-screen items-center justify-center bg-[#f7f5f0]"
   > <p className="text-sm text-black/50">
جاري تحميل الطلبات الحقيقية... </p> </main>
);
}

return ( <main
   dir="rtl"
   className="min-h-screen bg-[#f7f5f0] px-5 py-8 sm:px-8"
 > <div className="mx-auto max-w-7xl"> <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"> <div> <p className="mb-2 text-xs font-medium tracking-[0.25em] text-black/35">
HAMMAR OS </p>

        <h1 className="text-3xl font-black sm:text-4xl">
          الطلبات
        </h1>

        <p className="mt-2 text-sm text-black/45">
          جميع الطلبات الموجودة فعليًا في قاعدة البيانات
        </p>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={loadOrders}
          className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold transition hover:bg-black hover:text-white"
        >
          تحديث
        </button>

        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:opacity-80"
        >
          لوحة التحكم
        </button>
      </div>
    </div>

    {error && (
      <div className="mb-6 rounded-2xl bg-red-50 px-5 py-4 text-sm font-semibold text-red-600">
        {error}
      </div>
    )}

    <div className="mb-6 grid gap-4 sm:grid-cols-3">
      <div className="rounded-[24px] border border-black/5 bg-white p-6 shadow-sm">
        <p className="text-sm text-black/45">
          إجمالي الطلبات
        </p>

        <p className="mt-2 text-3xl font-black">
          {orders.length}
        </p>
      </div>

      <div className="rounded-[24px] border border-black/5 bg-white p-6 shadow-sm">
        <p className="text-sm text-black/45">
          الطلبات الجديدة
        </p>

        <p className="mt-2 text-3xl font-black">
          {
            orders.filter(
              (order) => order.status === "جديد"
            ).length
          }
        </p>
      </div>

      <div className="rounded-[24px] border border-black/5 bg-white p-6 shadow-sm">
        <p className="text-sm text-black/45">
          قيمة الطلبات
        </p>

        <p className="mt-2 text-3xl font-black">
          {orders
            .reduce(
              (total, order) =>
                total + Number(order.total),
              0
            )
            .toFixed(3)}{" "}
          ر.ع
        </p>
      </div>
    </div>

    {orders.length === 0 ? (
      <div className="rounded-[30px] border border-black/5 bg-white p-12 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-black text-3xl text-white">
          📦
        </div>

        <h2 className="text-2xl font-black">
          لا توجد طلبات
        </h2>

        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-black/45">
          لا توجد أي طلبات محفوظة في Firestore حاليًا.
          عندما يقوم عميل بإرسال طلب حقيقي سيظهر هنا.
        </p>
      </div>
    ) : (
      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="rounded-[28px] border border-black/5 bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-lg font-black">
                    {order.customer?.name ||
                      "عميل"}
                  </h2>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="mt-3 grid gap-2 text-sm text-black/50 sm:grid-cols-2">
                  <p>
                    📞{" "}
                    <span
                      className="font-semibold text-black"
                      dir="ltr"
                    >
                      {order.customer?.phone ||
                        "غير موجود"}
                    </span>
                  </p>

                  <p>
                    📅 {formatDate(order.createdAt)}
                  </p>

                  <p className="sm:col-span-2">
                    📍{" "}
                    <span className="text-black/70">
                      {order.customer?.address ||
                        "غير موجود"}
                    </span>
                  </p>

                  <p className="sm:col-span-2 text-xs text-black/35">
                    رقم الطلب: #{order.id}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-5 sm:justify-end">
                  <div className="text-left">
                    <p className="text-xs text-black/40">
                      الإجمالي
                    </p>

                    <p className="text-2xl font-black">
                      {Number(order.total).toFixed(3)} ر.ع
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() =>
                      openWhatsApp(order)
                    }
                    className="flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-bold text-white transition hover:scale-[1.02] hover:brightness-95"
                  >
                    <span className="text-base">
                      واتساب
                    </span>
                    <span>↗</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedOrder(order)
                    }
                    className="rounded-full border border-black/10 px-5 py-3 text-sm font-semibold transition hover:bg-black hover:text-white"
                  >
                    تفاصيل الطلب
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}

    {selectedOrder && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5">
        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[30px] bg-white p-6 shadow-2xl sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs tracking-[0.2em] text-black/35">
                ORDER
              </p>

              <h2 className="mt-2 text-2xl font-black">
                تفاصيل الطلب
              </h2>

              <p className="mt-2 text-xs text-black/40">
                #{selectedOrder.id}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setSelectedOrder(null)
              }
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/5 text-lg transition hover:bg-black hover:text-white"
            >
              ×
            </button>
          </div>

          <div className="mt-7 rounded-3xl bg-[#f7f5f0] p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-black/40">
                  العميل
                </p>

                <p className="mt-1 font-bold">
                  {selectedOrder.customer?.name ||
                    "غير موجود"}
                </p>
              </div>

              <div>
                <p className="text-xs text-black/40">
                  الهاتف
                </p>

                <p
                  className="mt-1 font-bold"
                  dir="ltr"
                >
                  {selectedOrder.customer?.phone ||
                    "غير موجود"}
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-xs text-black/40">
                  العنوان
                </p>

                <p className="mt-1 font-bold">
                  {selectedOrder.customer?.address ||
                    "غير موجود"}
                </p>
              </div>

              {selectedOrder.customer?.notes && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-black/40">
                    الملاحظات
                  </p>

                  <p className="mt-1 font-bold">
                    {selectedOrder.customer.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-black">
              المنتجات
            </h3>

            <div className="mt-4 space-y-3">
              {selectedOrder.items.map(
                (item, index) => (
                  <div
                    key={`${item.productId}-${index}`}
                    className="flex items-center gap-4 rounded-2xl border border-black/5 p-3"
                  >
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#f5f3ee]">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-bold">
                        {item.name}
                      </p>
                      {item.preOrder && <p className="mt-1 text-xs font-bold text-amber-800">طلب مسبق — يتوفر قريب</p>}

                      <p className="mt-1 text-xs text-black/40">
                        الكمية: {item.quantity}
                      </p>
                    </div>

                    <p className="font-bold">
                      {(
                        Number(item.price) *
                        item.quantity
                      ).toFixed(3)}{" "}
                      ر.ع
                    </p>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="mt-6 rounded-3xl bg-[#f7f5f0] p-5">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-black/50">
                  المنتجات
                </span>

                <span className="font-bold">
                  {Number(
                    selectedOrder.subtotal
                  ).toFixed(3)}{" "}
                  ر.ع
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-black/50">
                  التوصيل
                </span>

                <span className="font-bold">
                  {Number(
                    selectedOrder.shippingPrice
                  ).toFixed(3)}{" "}
                  ر.ع
                </span>
              </div>

              <div className="h-px bg-black/10" />

              <div className="flex justify-between">
                <span className="font-bold">
                  الإجمالي
                </span>

                <span className="text-xl font-black">
                  {Number(
                    selectedOrder.total
                  ).toFixed(3)}{" "}
                  ر.ع
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-[#25D366]/20 bg-[#25D366]/5 p-5">
            <p className="text-sm font-bold">
              جاهز للتواصل مع العميل؟
            </p>

            <p className="mt-1 text-xs leading-5 text-black/45">
              سيتم فتح واتساب على رقم العميل مع رسالة
              جاهزة تحتوي على اسمه ورقم الطلب والمبلغ
              ورقم التحويل.
            </p>

            <button
              type="button"
              onClick={() =>
                openWhatsApp(selectedOrder)
              }
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-5 py-4 text-sm font-black text-white transition hover:brightness-95"
            >
              إرسال رسالة واتساب
              <span>↗</span>
            </button>
          </div>

          <div className="mt-6">
            <label className="mb-2 block text-sm font-bold">
              حالة الطلب
            </label>

            <select
              value={selectedOrder.status}
              onChange={(e) =>
                changeStatus(
                  selectedOrder.id,
                  e.target.value
                )
              }
              disabled={
                updatingId === selectedOrder.id
              }
              className="w-full rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-4 font-semibold outline-none focus:border-black"
            >
              {statuses.map((status) => (
                <option
                  key={status}
                  value={status}
                >
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() =>
                deleteOrder(selectedOrder.id)
              }
              className="rounded-2xl border border-red-200 px-5 py-4 text-sm font-bold text-red-500 transition hover:bg-red-50"
            >
              حذف الطلب
            </button>

            <button
              type="button"
              onClick={() =>
                setSelectedOrder(null)
              }
              className="flex-1 rounded-2xl bg-black px-5 py-4 text-sm font-bold text-white transition hover:opacity-80"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
</main>


);
}
