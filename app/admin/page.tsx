"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import {
collection,
getDocs,
orderBy,
query,
updateDoc,
doc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type OrderItem = {
name?: string;
quantity?: number;
price?: number;
};

type Order = {
id: string;
userId?: string;
customerName?: string;
customerEmail?: string;
phone?: string;
governorate?: string;
city?: string;
address?: string;
notes?: string;
items?: OrderItem[];
subtotal?: number;
shipping?: number;
total?: number;
paymentMethod?: string;
status?: string;
createdAt?: any;
};

const statuses = [
{
value: "pending",
label: "قيد المراجعة",
className: "bg-amber-50 text-amber-700 border-amber-200",
},
{
value: "confirmed",
label: "تم التأكيد",
className: "bg-blue-50 text-blue-700 border-blue-200",
},
{
value: "processing",
label: "جاري التجهيز",
className: "bg-purple-50 text-purple-700 border-purple-200",
},
{
value: "shipped",
label: "تم الشحن",
className: "bg-indigo-50 text-indigo-700 border-indigo-200",
},
{
value: "delivered",
label: "تم التوصيل",
className: "bg-emerald-50 text-emerald-700 border-emerald-200",
},
{
value: "cancelled",
label: "ملغي",
className: "bg-red-50 text-red-700 border-red-200",
},
];

export default function AdminPage() {
const router = useRouter();

const [user, setUser] = useState<User | null>(null);
const [orders, setOrders] = useState<Order[]>([]);
const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);
const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

const [search, setSearch] = useState("");
const [filterStatus, setFilterStatus] = useState("all");

useEffect(() => {
const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
if (!currentUser) {
router.replace("/login");
return;
}


  try {
    const tokenResult = await currentUser.getIdTokenResult(true);
    const role = tokenResult.claims.role;

    if (role !== "admin") {
      router.replace("/");
      return;
    }

    setUser(currentUser);
    await loadOrders();
  } catch (error) {
    console.error("Admin authentication error:", error);
    router.replace("/");
  } finally {
    setLoading(false);
  }
});

return () => unsubscribe();


}, [router]);

async function loadOrders() {
try {
setRefreshing(true);


  const ordersRef = collection(db, "orders");

  const ordersQuery = query(
    ordersRef,
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(ordersQuery);

  const loadedOrders: Order[] = snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  })) as Order[];

  setOrders(loadedOrders);
} catch (error) {
  console.error("Error loading admin orders:", error);
} finally {
  setRefreshing(false);
}


}

async function changeStatus(orderId: string, newStatus: string) {
try {
setUpdatingOrder(orderId);


  await updateDoc(doc(db, "orders", orderId), {
    status: newStatus,
  });

  setOrders((currentOrders) =>
    currentOrders.map((order) =>
      order.id === orderId
        ? { ...order, status: newStatus }
        : order
    )
  );
} catch (error) {
  console.error("Error updating order:", error);
  alert("حدث خطأ أثناء تحديث حالة الطلب");
} finally {
  setUpdatingOrder(null);
}


}

async function handleLogout() {
try {
await signOut(auth);
router.replace("/login");
} catch (error) {
console.error("Logout error:", error);
}
}

function getStatus(status?: string) {
return (
statuses.find((item) => item.value === status) ||
statuses[0]
);
}

function formatDate(createdAt: any) {
if (!createdAt) return "غير محدد";


try {
  const date = createdAt.toDate
    ? createdAt.toDate()
    : new Date(createdAt);

  return new Intl.DateTimeFormat("ar-OM", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
} catch {
  return "غير محدد";
}


}

const filteredOrders = useMemo(() => {
return orders.filter((order) => {
const searchText = search.toLowerCase().trim();


  const matchesSearch =
    !searchText ||
    order.customerName?.toLowerCase().includes(searchText) ||
    order.customerEmail?.toLowerCase().includes(searchText) ||
    order.phone?.includes(searchText) ||
    order.id.toLowerCase().includes(searchText);

  const matchesStatus =
    filterStatus === "all" ||
    order.status === filterStatus;

  return matchesSearch && matchesStatus;
});


}, [orders, search, filterStatus]);

const statistics = useMemo(() => {
const totalOrders = orders.length;


const pendingOrders = orders.filter(
  (order) => order.status === "pending"
).length;

const deliveredOrders = orders.filter(
  (order) => order.status === "delivered"
).length;

const cancelledOrders = orders.filter(
  (order) => order.status === "cancelled"
).length;

const totalSales = orders
  .filter((order) => order.status !== "cancelled")
  .reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

const paidOrders = orders.filter(
  (order) => order.status !== "cancelled"
).length;

const averageOrder =
  paidOrders > 0 ? totalSales / paidOrders : 0;

const customers = new Set(
  orders
    .map((order) => order.userId)
    .filter(Boolean)
).size;

return {
  totalOrders,
  pendingOrders,
  deliveredOrders,
  cancelledOrders,
  totalSales,
  averageOrder,
  customers,
};


}, [orders]);

if (loading) {
return ( <main
     dir="rtl"
     className="flex min-h-screen items-center justify-center bg-[#f5f4ef]"
   > <div className="text-center"> <div className="mx-auto mb-5 h-11 w-11 animate-spin rounded-full border-4 border-black/10 border-t-black" />

```
      <p className="text-sm text-gray-500">
        جاري تحميل لوحة التحكم...
      </p>
    </div>
  </main>
);


}

if (!user) return null;

return ( <main
   dir="rtl"
   className="min-h-screen bg-[#f5f4ef] text-[#171717]"
 >
{/* HEADER */} <header className="sticky top-0 z-40 border-b border-black/10 bg-[#f5f4ef]/90 backdrop-blur-xl"> <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8"> <div className="flex min-w-0 items-center gap-3"> <Link
           href="/"
           className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-black text-sm font-bold text-white shadow-sm"
         >
ه </Link>


        <div className="min-w-0">
          <h1 className="truncate text-base font-bold md:text-lg">
            لوحة تحكم همار
          </h1>

          <p className="truncate text-xs text-gray-500">
            إدارة المتجر والطلبات
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/admin/products"
          className="hidden rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-medium transition hover:border-black md:block"
        >
          المنتجات
        </Link>

        <Link
          href="/admin/settings"
          className="hidden rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-medium transition hover:border-black md:block"
        >
          إعدادات المتجر
        </Link>

        <Link
          href="/"
          className="hidden rounded-full border border-black/10 px-4 py-2.5 text-sm transition hover:bg-white lg:block"
        >
          زيارة المتجر
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full bg-black px-4 py-2.5 text-sm text-white transition hover:opacity-80"
        >
          خروج
        </button>
      </div>
    </div>
  </header>

  {/* CONTENT */}
  <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-10">

    {/* HERO */}
    <section className="mb-8 overflow-hidden rounded-[2rem] bg-black p-7 text-white md:p-10">
      <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
        <div>
          <p className="mb-3 text-sm text-white/50">
            مرحبًا بك في إدارة المتجر
          </p>

          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
            نظرة عامة
          </h2>

          <p className="mt-4 max-w-xl text-sm leading-7 text-white/60">
            تابع الطلبات والمبيعات والعملاء من مكان واحد
          </p>
        </div>

        <button
          type="button"
          onClick={loadOrders}
          disabled={refreshing}
          className="w-full rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
        >
          {refreshing ? "جاري التحديث..." : "تحديث البيانات"}
        </button>
      </div>
    </section>

    {/* STATS */}
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-[1.7rem] border border-black/10 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            إجمالي الطلبات
          </span>

          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-lg text-white">
            🛍
          </span>
        </div>

        <p className="text-3xl font-bold">
          {statistics.totalOrders}
        </p>

        <p className="mt-2 text-xs text-gray-400">
          جميع الطلبات
        </p>
      </div>

      <div className="rounded-[1.7rem] border border-black/10 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            المبيعات
          </span>

          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-xs font-bold text-white">
            ر.ع
          </span>
        </div>

        <p className="text-3xl font-bold">
          {statistics.totalSales.toFixed(2)}
        </p>

        <p className="mt-2 text-xs text-gray-400">
          إجمالي المبيعات
        </p>
      </div>

      <div className="rounded-[1.7rem] border border-black/10 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            قيد المراجعة
          </span>

          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-lg">
            ⏳
          </span>
        </div>

        <p className="text-3xl font-bold">
          {statistics.pendingOrders}
        </p>

        <p className="mt-2 text-xs text-gray-400">
          تحتاج إلى مراجعة
        </p>
      </div>

      <div className="rounded-[1.7rem] border border-black/10 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            تم التوصيل
          </span>

          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-lg text-emerald-700">
            ✓
          </span>
        </div>

        <p className="text-3xl font-bold">
          {statistics.deliveredOrders}
        </p>

        <p className="mt-2 text-xs text-gray-400">
          طلب مكتمل
        </p>
      </div>
    </section>

    {/* SECONDARY STATS */}
    <section className="mt-4 grid gap-4 md:grid-cols-3">
      <div className="rounded-[1.7rem] border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-500">
          العملاء
        </p>

        <p className="mt-2 text-3xl font-bold">
          {statistics.customers}
        </p>
      </div>

      <div className="rounded-[1.7rem] border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-500">
          متوسط قيمة الطلب
        </p>

        <p className="mt-2 text-3xl font-bold">
          {statistics.averageOrder.toFixed(2)}
          <span className="mr-2 text-sm font-medium text-gray-400">
            ر.ع
          </span>
        </p>
      </div>

      <div className="rounded-[1.7rem] border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-500">
          الطلبات الملغاة
        </p>

        <p className="mt-2 text-3xl font-bold text-red-600">
          {statistics.cancelledOrders}
        </p>
      </div>
    </section>

    {/* QUICK ACTIONS */}
    <section className="mt-10">
      <div className="mb-4">
        <h2 className="text-xl font-bold">
          الوصول السريع
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          أهم أدوات إدارة المتجر
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/products"
          className="group rounded-[1.7rem] border border-black/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-black/20"
        >
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-xl text-white">
            ✦
          </div>

          <h3 className="font-bold">
            إدارة المنتجات
          </h3>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            إضافة وتعديل وحذف المنتجات والصور
          </p>

          <div className="mt-5 text-sm font-semibold">
            فتح المنتجات ←
          </div>
        </Link>

        <Link
          href="/admin/settings"
          className="group rounded-[1.7rem] border border-black/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-black/20"
        >
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-xl text-white">
            ⚙
          </div>

          <h3 className="font-bold">
            إعدادات المتجر
          </h3>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            اسم المتجر والوصف والشعار والهوية
          </p>

          <div className="mt-5 text-sm font-semibold">
            فتح الإعدادات ←
          </div>
        </Link>

        <Link
          href="/"
          className="group rounded-[1.7rem] border border-black/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-black/20"
        >
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-xl text-white">
            ↗
          </div>

          <h3 className="font-bold">
            زيارة المتجر
          </h3>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            مشاهدة المتجر كما يراه العملاء
          </p>

          <div className="mt-5 text-sm font-semibold">
            فتح المتجر ←
          </div>
        </Link>
      </div>
    </section>

    {/* ORDERS */}
    <section className="mt-12">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            الطلبات
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            إدارة ومتابعة جميع طلبات العملاء
          </p>
        </div>

        <span className="w-fit rounded-full bg-black px-4 py-2 text-xs font-semibold text-white">
          {filteredOrders.length} طلب
        </span>
      </div>

      {/* SEARCH */}
      <div className="mb-5 rounded-[1.7rem] border border-black/10 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="ابحث بالاسم أو الإيميل أو رقم الهاتف أو رقم الطلب"
            className="h-12 rounded-2xl border border-black/10 bg-[#f7f6f2] px-4 text-sm outline-none transition focus:border-black"
          />

          <select
            value={filterStatus}
            onChange={(event) =>
              setFilterStatus(event.target.value)
            }
            className="h-12 rounded-2xl border border-black/10 bg-[#f7f6f2] px-4 text-sm outline-none focus:border-black"
          >
            <option value="all">
              جميع الحالات
            </option>

            {statuses.map((status) => (
              <option
                key={status.value}
                value={status.value}
              >
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="rounded-[2rem] border border-black/10 bg-white px-6 py-24 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-black text-2xl text-white">
            📦
          </div>

          <h3 className="text-xl font-bold">
            لا توجد طلبات
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            ما حصلنا على طلبات مطابقة للبحث الحالي
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredOrders.map((order) => {
            const status = getStatus(order.status);

            return (
              <article
                key={order.id}
                className="overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-sm"
              >
                <div className="p-5 md:p-8">
                  {/* ORDER HEADER */}
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs text-gray-400">
                          رقم الطلب
                        </span>

                        <span className="rounded-full bg-black px-3 py-1.5 text-xs font-bold text-white">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                      </div>

                      <h3 className="mt-4 text-xl font-bold">
                        {order.customerName || "عميل"}
                      </h3>

                      <div className="mt-2 space-y-1 text-sm text-gray-500">
                        <p>
                          {order.customerEmail ||
                            "بدون بريد"}
                        </p>

                        <p>
                          {order.phone ||
                            "بدون رقم هاتف"}
                        </p>

                        {(order.governorate ||
                          order.city) && (
                          <p>
                            {order.governorate || ""}
                            {order.city
                              ? ` - ${order.city}`
                              : ""}
                          </p>
                        )}
                      </div>

                      <p className="mt-3 text-xs text-gray-400">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 lg:items-end">
                      <span
                        className={`w-fit rounded-full border px-4 py-2 text-xs font-semibold ${status.className}`}
                      >
                        {status.label}
                      </span>

                      <select
                        value={
                          order.status || "pending"
                        }
                        disabled={
                          updatingOrder === order.id
                        }
                        onChange={(event) =>
                          changeStatus(
                            order.id,
                            event.target.value
                          )
                        }
                        className="h-11 rounded-xl border border-black/10 bg-[#f7f6f2] px-4 text-sm outline-none focus:border-black disabled:opacity-50"
                      >
                        {statuses.map((item) => (
                          <option
                            key={item.value}
                            value={item.value}
                          >
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="my-7 h-px bg-black/10" />

                  {/* PRODUCTS */}
                  <div>
                    <h4 className="mb-4 text-sm font-bold">
                      المنتجات
                    </h4>

                    <div className="space-y-3">
                      {order.items?.length ? (
                        order.items.map(
                          (item, index) => {
                            const quantity = Number(
                              item.quantity || 1
                            );

                            const price = Number(
                              item.price || 0
                            );

                            return (
                              <div
                                key={`${order.id}-${index}`}
                                className="flex items-center justify-between gap-4 rounded-2xl bg-[#f7f6f2] px-4 py-3"
                              >
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold">
                                    {item.name ||
                                      "منتج"}
                                  </p>

                                  <p className="mt-1 text-xs text-gray-500">
                                    الكمية:{" "}
                                    {quantity}
                                  </p>
                                </div>

                                <p className="shrink-0 text-sm font-bold">
                                  {(
                                    price * quantity
                                  ).toFixed(2)}{" "}
                                  ر.ع
                                </p>
                              </div>
                            );
                          }
                        )
                      ) : (
                        <div className="rounded-2xl bg-[#f7f6f2] px-4 py-5 text-sm text-gray-500">
                          لا توجد تفاصيل للمنتجات
                        </div>
                      )}
                    </div>
                  </div>

                  {/* NOTES */}
                  {order.notes && (
                    <>
                      <div className="my-6 h-px bg-black/10" />

                      <div>
                        <p className="mb-2 text-xs font-semibold text-gray-500">
                          ملاحظات العميل
                        </p>

                        <p className="rounded-2xl bg-[#f7f6f2] p-4 text-sm leading-7">
                          {order.notes}
                        </p>
                      </div>
                    </>
                  )}

                  <div className="my-6 h-px bg-black/10" />

                  {/* SUMMARY */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-gray-500">
                        طريقة الدفع
                      </p>

                      <p className="mt-1 text-sm font-semibold">
                        {order.paymentMethod ||
                          "غير محددة"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        الشحن
                      </p>

                      <p className="mt-1 text-sm font-semibold">
                        {Number(
                          order.shipping || 0
                        ).toFixed(2)}{" "}
                        ر.ع
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        الإجمالي
                      </p>

                      <p className="mt-1 text-xl font-bold">
                        {Number(
                          order.total || 0
                        ).toFixed(2)}{" "}
                        ر.ع
                      </p>
                    </div>
                  </div>

                  {/* ADDRESS */}
                  {order.address && (
                    <>
                      <div className="my-6 h-px bg-black/10" />

                      <div>
                        <p className="text-xs text-gray-500">
                          عنوان التوصيل
                        </p>

                        <p className="mt-2 rounded-2xl bg-[#f7f6f2] p-4 text-sm leading-7">
                          {order.address}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>

    <footer className="py-12 text-center text-xs text-gray-400">
      © {new Date().getFullYear()} همار — لوحة التحكم
    </footer>
  </div>
</main>


);
}
