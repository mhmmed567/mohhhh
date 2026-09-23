import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { normalizeOrderStatus, planOrderStatusUpdate } from "./order-workflow";

export async function updateOrderStatus(orderId: string, status: string, paymentConfirmed = false, expectedStatus?: string) {
  return runTransaction(db, async (transaction) => {
    const ref = doc(db, "orders", orderId);
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error("الطلب غير موجود");
    const data = snapshot.data();
    if (expectedStatus !== undefined && normalizeOrderStatus(data.status) !== normalizeOrderStatus(expectedStatus)) {
      throw new Error("تغيرت حالة الطلب بواسطة مستخدم آخر. حدّث الطلبات ثم حاول مجددًا.");
    }
    const update = planOrderStatusUpdate(data, status, paymentConfirmed);
    transaction.update(ref, { ...update, updatedAt: serverTimestamp() });
    return update;
  });
}
