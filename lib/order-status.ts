import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { normalizeOrderStatus, planOrderStatusUpdate } from "./order-workflow";
import { getInventoryQuantity } from "./products";

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
    const timestamp = serverTimestamp();
    const orderPatch: Record<string, unknown> = {
      ...update,
      updatedAt: timestamp,
    };

    const shouldDeductInventory =
      update.status === "تم التحويل" &&
      update.paymentStatus === "مدفوع" &&
      !data.inventoryAdjustedAt;

    if (shouldDeductInventory) {
      const orderedQuantities = new Map<string, { name: string; quantity: number }>();

      for (const item of Array.isArray(data.items) ? data.items : []) {
        const productId = String(item?.productId ?? "").trim();
        const quantity = Number(item?.quantity ?? 0);
        if (!productId || !Number.isInteger(quantity) || quantity <= 0) continue;

        const current = orderedQuantities.get(productId);
        orderedQuantities.set(productId, {
          name: String(item?.name ?? "العطر"),
          quantity: (current?.quantity ?? 0) + quantity,
        });
      }

      const inventoryUpdates: Array<{
        ref: ReturnType<typeof doc>;
        quantity: number;
        stock: string;
      }> = [];

      for (const [productId, ordered] of orderedQuantities) {
        const productRef = doc(db, "products", productId);
        const productSnapshot = await transaction.get(productRef);
        if (!productSnapshot.exists()) {
          throw new Error(`العطر غير موجود: ${ordered.name}`);
        }

        const product = productSnapshot.data();
        const availableQuantity = getInventoryQuantity(product.quantity);

        // المنتجات القديمة بلا كمية تستمر بالعمل حتى يحدد المدير مخزونها.
        if (availableQuantity === null) continue;
        if (availableQuantity < ordered.quantity) {
          throw new Error(`الكمية المتوفرة من ${ordered.name} لا تكفي لهذا الطلب.`);
        }

        const remainingQuantity = availableQuantity - ordered.quantity;
        inventoryUpdates.push({
          ref: productRef,
          quantity: remainingQuantity,
          stock:
            remainingQuantity === 0
              ? "نفد المخزون"
              : product.stock === "نفد المخزون"
                ? "متوفر"
                : String(product.stock ?? "متوفر"),
        });
      }

      for (const product of inventoryUpdates) {
        transaction.update(product.ref, {
          quantity: product.quantity,
          stock: product.stock,
          updatedAt: timestamp,
        });
      }

      if (inventoryUpdates.length > 0) {
        orderPatch.inventoryAdjustedAt = timestamp;
      }
    }

    transaction.update(ref, orderPatch);
    return update;
  });
}
