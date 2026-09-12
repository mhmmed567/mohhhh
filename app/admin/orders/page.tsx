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

type Customer = {
  name: string;
  phone: string;
  address: string;
  notes: string;
};

type OrderItem = {
  productId: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  image?: string;
};

type Order = {
  id: string;
  userId?: string | null;

  customer: Customer;

  items: OrderItem[];

  subtotal: number;
  shippingPrice: number;
  total: number;

  paymentMethod: string;
  paymentStatus: string;

  status: string;

  createdAt?: {
    seconds: number;
    nanoseconds: number;
  } | null;
};

const statuses = [
  "قيد المراجعة",
  "تم التأكيد",
  "جاري التجهيز",
  "تم الشحن",
  "تم التوصيل",
  "ملغي",
];

export default function AdminOrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      try {
        const token = await user.getIdTokenResult(true);
        const role = token.claims.role;

        if (role !== "admin" && role !== "staff") {
          router.replace("/");
          return;
        }

        await loadOrders();
      } catch (error) {
        console.error("Auth error:", error);
        router.replace("/");
      }
    });

    return () => unsubscribe();
  }, [router]);

  async function loadOrders() {
    try {
      setLoading(true);

      const ordersQuery = query(
        collection(db, "orders"),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(ordersQuery);

      const loadedOrders: Order[] = snapshot.docs.map((orderDoc) => {
        const data = orderDoc.data();

        const rawCustomer = data.customer;

        const customer: Customer =
          rawCustomer && typeof rawCustomer === "object"
            ? {
                name:
                  typeof rawCustomer.name === "string"
                    ? rawCustomer.name
                    : "",
                phone:
                  typeof rawCustomer.phone === "string"
                    ? rawCustomer.phone
                    : "",
                address:
                  typeof rawCustomer.address === "string"
                    ? rawCustomer.address
                    : "",
                notes:
                  typeof rawCustomer.notes === "string"
                    ? rawCustomer.notes
                    : "",
              }
            : {
                name:
                  typeof data.name === "string"
                    ? data.name
                    : "",
                phone:
                  typeof data.phone === "string"
                    ? data.phone
                    : "",
                address:
                  typeof data.address === "string"
                    ? data.address
                    : "",
                notes:
                  typeof data.notes === "string"
                    ? data.notes
                    : "",
              };

        return {
          id: orderDoc.id,

          userId:
            typeof data.userId === "string"
              ? data.userId
              : null,

          customer,

          items: Array.isArray(data.items)
            ? data.items.map((item: any) => ({
                productId: item.productId ?? "",
                name: item.name ?? "منتج",
                description: item.description ?? "",
                price: Number(item.price ?? 0),
                quantity: Number(item.quantity ?? 1),
                image: item.image ?? "",
              }))
            : [],

          subtotal: Number(data.subtotal ?? 0),
          shippingPrice: Number(data.shippingPrice ?? 0),
          total: Number(data.total ?? 0),

          paymentMethod:
            data.paymentMethod ?? "الدفع عند الاستلام",

          paymentStatus:
            data.paymentStatus ?? "غير مدفوع",

          status:
            data.status ?? "قيد المراجعة",

          createdAt: data.createdAt ?? null,
        };
      });

      setOrders(loadedOrders);
    } catch (error) {
      console.error("Load orders error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(orderId: string, status: string) {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status,
        updatedAt: new Date(),
      });

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId
            ? { ...order, status }
            : order
        )
      );

      setSelectedOrder((current) =>
        current && current.id === orderId
          ? { ...current, status }
          : current
      );
    } catch (error) {
      console.error("Change status error:", error);
      alert("حدث خطأ أثناء تحديث حالة الطلب");
    }
  }

  async function deleteOrder(orderId: string) {
    const confirmed = confirm(
      "هل أنت متأكد من حذف هذا الطلب؟"
    );

    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "orders", orderId));

      setOrders((currentOrders) =>
        currentOrders.filter(
          (order) => order.id !== orderId
        )
      );

      setSelectedOrder(null);
    } catch (error) {
      console.error("Delete order error:", error);
      alert("حدث خطأ أثناء حذف الطلب");
    }
  }

  function formatDate(
    timestamp?: {
      seconds: number;
      nanoseconds: number;
    } | null
  ) {
    if (!timestamp?.seconds) {
      return "غير معروف";
    }

    return new Intl.DateTimeFormat("ar-OM", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(timestamp.seconds * 1000));
  }

  if (loading) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-[#f7f7f5] p-6"
      >
        <div className="mx-auto max-w-7xl">
          <p className="text-gray-500">
            جاري تحميل الطلبات...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f7f7f5] p-4 md:p-8"
    >
      <div className="mx-auto max-w-7xl">
        {/* العنوان */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black">
              الطلبات
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              إدارة جميع طلبات العملاء
            </p>
          </div>

          <button
            onClick={loadOrders}
            className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:opacity-80"
          >
            تحديث
          </button>
        </div>

        {/* لا توجد طلبات */}
        {orders.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
            <h2 className="text-xl font-semibold">
              لا توجد طلبات
            </h2>

            <p className="mt-2 text-gray-500">
              عندما يطلب أحد العملاء سيظهر الطلب هنا
            </p>
          </div>
        ) : (
          <div className="grid gap-5">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                {/* رأس الطلب */}
                <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs text-gray-400">
                      رقم الطلب
                    </p>

                    <p className="mt-1 font-mono text-lg font-bold">
                      #{order.id}
                    </p>

                    <p className="mt-1 text-sm text-gray-400">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      value={order.status}
                      onChange={(e) =>
                        changeStatus(
                          order.id,
                          e.target.value
                        )
                      }
                      className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none"
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

                    <button
                      onClick={() =>
                        setSelectedOrder(order)
                      }
                      className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white"
                    >
                      تفاصيل الطلب
                    </button>
                  </div>
                </div>

                {/* بيانات العميل */}
                <div className="mt-5 grid gap-4 md:grid-cols-4">
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-xs text-gray-400">
                      اسم العميل
                    </p>

                    <p className="mt-1 font-semibold">
                      {order.customer.name ||
                        "بدون اسم"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-xs text-gray-400">
                      رقم الهاتف
                    </p>

                    <p className="mt-1 font-semibold">
                      {order.customer.phone ||
                        "بدون رقم هاتف"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-xs text-gray-400">
                      العنوان
                    </p>

                    <p className="mt-1 font-semibold">
                      {order.customer.address ||
                        "بدون عنوان"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-xs text-gray-400">
                      الإجمالي
                    </p>

                    <p className="mt-1 text-lg font-bold">
                      {order.total.toFixed(2)} ر.ع
                    </p>
                  </div>
                </div>

                {/* المنتجات */}
                <div className="mt-5">
                  <p className="mb-3 text-sm font-semibold">
                    المنتجات
                  </p>

                  <div className="space-y-2">
                    {order.items.map(
                      (item, index) => (
                        <div
                          key={`${order.id}-${index}`}
                          className="flex items-center justify-between rounded-xl border border-gray-100 p-3"
                        >
                          <div>
                            <p className="font-semibold">
                              {item.name}
                            </p>

                            <p className="text-sm text-gray-500">
                              الكمية: {item.quantity}
                            </p>
                          </div>

                          <p className="font-semibold">
                            {(
                              item.price *
                              item.quantity
                            ).toFixed(2)}{" "}
                            ر.ع
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* نافذة تفاصيل الطلب */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6">
            {/* العنوان */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">
                  رقم الطلب
                </p>

                <h2 className="font-mono text-xl font-bold">
                  #{selectedOrder.id}
                </h2>
              </div>

              <button
                onClick={() =>
                  setSelectedOrder(null)
                }
                className="rounded-full bg-gray-100 px-4 py-2 text-sm"
              >
                إغلاق
              </button>
            </div>

            {/* بيانات العميل */}
            <section className="mb-6 rounded-2xl bg-gray-50 p-5">
              <h3 className="mb-4 text-lg font-bold">
                بيانات العميل
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-400">
                    الاسم
                  </p>

                  <p className="mt-1 font-semibold">
                    {selectedOrder.customer.name ||
                      "بدون اسم"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-400">
                    رقم الهاتف
                  </p>

                  <p className="mt-1 font-semibold">
                    {selectedOrder.customer.phone ||
                      "بدون رقم هاتف"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-400">
                    العنوان
                  </p>

                  <p className="mt-1 font-semibold">
                    {selectedOrder.customer.address ||
                      "بدون عنوان"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-400">
                    الملاحظات
                  </p>

                  <p className="mt-1 font-semibold">
                    {selectedOrder.customer.notes ||
                      "لا توجد ملاحظات"}
                  </p>
                </div>
              </div>
            </section>

            {/* المنتجات */}
            <section className="mb-6">
              <h3 className="mb-4 text-lg font-bold">
                المنتجات
              </h3>

              <div className="space-y-3">
                {selectedOrder.items.map(
                  (item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-2xl border border-gray-200 p-4"
                    >
                      <div>
                        <p className="font-semibold">
                          {item.name}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          الكمية: {item.quantity}
                        </p>
                      </div>

                      <p className="font-bold">
                        {(
                          item.price *
                          item.quantity
                        ).toFixed(2)}{" "}
                        ر.ع
                      </p>
                    </div>
                  )
                )}
              </div>
            </section>

            {/* الدفع */}
            <section className="mb-6 rounded-2xl border border-gray-200 p-5">
              <div className="flex justify-between">
                <span className="text-gray-500">
                  طريقة الدفع
                </span>

                <span className="font-semibold">
                  {selectedOrder.paymentMethod}
                </span>
              </div>

              <div className="mt-3 flex justify-between">
                <span className="text-gray-500">
                  حالة الدفع
                </span>

                <span className="font-semibold">
                  {selectedOrder.paymentStatus}
                </span>
              </div>

              <div className="mt-3 flex justify-between">
                <span className="text-gray-500">
                  المنتجات
                </span>

                <span className="font-semibold">
                  {selectedOrder.subtotal.toFixed(2)} ر.ع
                </span>
              </div>

              <div className="mt-3 flex justify-between">
                <span className="text-gray-500">
                  الشحن
                </span>

                <span className="font-semibold">
                  {selectedOrder.shippingPrice.toFixed(
                    2
                  )}{" "}
                  ر.ع
                </span>
              </div>

              <div className="mt-4 border-t border-gray-200 pt-4">
                <div className="flex justify-between text-lg">
                  <span className="font-bold">
                    الإجمالي
                  </span>

                  <span className="font-bold">
                    {selectedOrder.total.toFixed(2)} ر.ع
                  </span>
                </div>
              </div>
            </section>

            {/* الحالة */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-semibold">
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
                className="w-full rounded-xl border border-gray-200 bg-white p-3 outline-none"
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

            {/* حذف */}
            <button
              onClick={() =>
                deleteOrder(selectedOrder.id)
              }
              className="w-full rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700"
            >
              حذف الطلب
            </button>
          </div>
        </div>
      )}
    </main>
  );
}