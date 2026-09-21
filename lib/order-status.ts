import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { giftStatusAllowed } from "@/lib/gifts";

export async function updateOrderStatus(orderId: string, status: string) {
  await runTransaction(db, async (transaction) => {
    const ref = doc(db, "orders", orderId);
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error("الطلب غير موجود");
    const data = snapshot.data();
    if (!giftStatusAllowed(data.isGift === true, data.paymentStatus, status)) {
      throw new Error("أكد وصول التحويل أولًا قبل تجهيز الهدية أو شحنها.");
    }
    transaction.update(ref, { status, updatedAt: serverTimestamp() });
  });
}
