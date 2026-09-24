const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function loadTs(file, dependencies = {}) {
  const filename = path.join(__dirname, "..", file);
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(source, { exports, require: (name) => {
    if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
    return dependencies[name];
  } }, { filename });
  return exports;
}
const workflow = loadTs("lib/order-workflow.ts");
const { normalizeOrderStatus, getOrderStatus, planOrderStatusUpdate, buildOrderMessage } = workflow;
const order = { id: "TEST-42", customer: { name: "عميل تجريبي", phone: "96890000000" }, total: 12.5, status: "بانتظار التحويل", paymentStatus: "غير مدفوع", paymentMethod: "تحويل مسبق" };

test("legacy states remain readable without treating preparation as payment", () => {
  for (const value of ["pending", "جديد", "بانتظار تأكيد التحويل"]) assert.equal(normalizeOrderStatus(value), "بانتظار التحويل");
  for (const value of ["delivered", "مكتمل", "تم التوصيل"]) assert.equal(getOrderStatus(value).label, "تم التسليم");
  assert.equal(getOrderStatus("cancelled").label, "ملغي");
  assert.equal(getOrderStatus("returned").label, "استرجاع الطلب");
  assert.equal(getOrderStatus("processing").label, "قيد التجهيز");
  assert.equal(getOrderStatus("confirmed").label, "تم التأكيد");
});

test("payment requires confirmation and updates the payment record", () => {
  assert.throws(() => planOrderStatusUpdate(order, "تم التحويل"), /أكد وصول/);
  const update = planOrderStatusUpdate(order, "تم التحويل", true);
  assert.equal(update.status, "تم التحويل");
  assert.equal(update.paymentStatus, "مدفوع");
  assert.throws(() => planOrderStatusUpdate(order, "arbitrary"), /غير صحيحة/);
});

test("prepaid and gift delivery requires payment; old COD orders still work", () => {
  assert.throws(() => planOrderStatusUpdate(order, "تم التسليم"), /أكد وصول/);
  assert.throws(() => planOrderStatusUpdate({ isGift: true }, "تم التسليم"), /أكد وصول/);
  assert.equal(planOrderStatusUpdate({ ...order, paymentStatus: "مدفوع" }, "تم التسليم").status, "تم التسليم");
  assert.equal(planOrderStatusUpdate({ ...order, paymentMethod: "الدفع عند الاستلام" }, "تم التسليم").status, "تم التسليم");
});

test("cancel and return retain payment and never record a refund automatically", () => {
  for (const status of ["ملغي", "استرجاع الطلب"]) {
    assert.equal(planOrderStatusUpdate({ ...order, paymentStatus: "مدفوع" }, status).paymentStatus, "مدفوع");
    assert.equal(planOrderStatusUpdate(order, status).paymentStatus, "غير مدفوع");
  }
});

test("paid/closed orders cannot request another transfer", () => {
  assert.throws(() => planOrderStatusUpdate({ ...order, status: "تم التحويل", paymentStatus: "مدفوع" }, "بانتظار التحويل"));
  for (const status of ["تم التسليم", "cancelled", "استرجاع الطلب"]) {
    assert.throws(() => planOrderStatusUpdate({ ...order, status }, "تم التحويل", true));
    assert.throws(() => planOrderStatusUpdate({ ...order, status }, "بانتظار التحويل"));
  }
});

test("transfer request uses configured bank number, amount and custom template", () => {
  assert.throws(() => buildOrderMessage(order), /رقم التحويل/);
  const settings = { name: "متجر تجريبي", transferPhone: "90000001" };
  const message = buildOrderMessage(order, settings);
  for (const text of ["TEST-42", "12.500", "90000001", "متجر تجريبي", "عميل تجريبي"]) assert.ok(message.includes(text));
  assert.equal(buildOrderMessage(order, { ...settings, whatsappMessage: "{name} #{orderId}: {total} => {transferPhone}" }), "عميل تجريبي #TEST-42: 12.500 => 90000001");
  assert.throws(() => buildOrderMessage({ ...order, paymentStatus: "مدفوع" }, settings), /تم دفع/);
});

test("each saved state has the matching message and no false refund promise", () => {
  assert.throws(() => buildOrderMessage({ ...order, status: "تم التحويل" }), /أكد وصول/);
  const paid = { ...order, status: "تم التحويل", paymentStatus: "مدفوع" };
  assert.match(buildOrderMessage(paid), /تم تأكيد وصول تحويلك/);
  assert.match(buildOrderMessage({ ...paid, status: "تم التسليم" }), /تم تسليم طلبك/);
  assert.match(buildOrderMessage({ ...paid, status: "ملغي" }), /تم إلغاء/);
  assert.match(buildOrderMessage({ ...paid, status: "استرجاع الطلب" }), /تم تسجيل استرجاع/);
  assert.doesNotMatch(buildOrderMessage({ ...paid, status: "استرجاع الطلب" }), /تم إرجاع المبلغ|تم إعادة المبلغ/);
});

test("gift billing messages address sender and preserve recipient privacy", () => {
  const giftOrder = { ...order, isGift: true, gift: { recipientName: "اسم خاص", recipientPhone: "96890000002" } };
  const message = buildOrderMessage(giftOrder, { transferPhone: "90000001" });
  assert.match(message, /الدفع والتأكيد معك فقط/);
  assert.doesNotMatch(message, /اسم خاص|96890000002/);
  assert.match(buildOrderMessage({ ...giftOrder, status: "تم التسليم" }), /تم تسليم هديتك/);
});

function databaseFixture(data, exists = true, fail = false) {
  const writes = [];
  const module = loadTs("lib/order-status.ts", {
    "./order-workflow": workflow,
    "@/lib/firebase": { db: {} },
    "firebase/firestore": {
      doc: (_, collection, id) => ({ collection, id }),
      serverTimestamp: () => "SERVER_TIME",
      runTransaction: async (_, callback) => {
        if (fail) throw new Error("permission-denied");
        return callback({ get: async () => ({ exists: () => exists, data: () => data }), update: (ref, update) => writes.push({ ref, update }) });
      },
    },
  });
  return { ...module, writes };
}

test("transaction atomically persists status and payment then returns confirmed data", async () => {
  const db = databaseFixture(order);
  const result = await db.updateOrderStatus(order.id, "تم التحويل", true, order.status);
  assert.equal(result.paymentStatus, "مدفوع");
  assert.equal(db.writes.length, 1);
  assert.equal(db.writes[0].update.status, "تم التحويل");
  assert.equal(db.writes[0].update.paymentStatus, "مدفوع");
  assert.equal(db.writes[0].update.updatedAt, "SERVER_TIME");
});

test("stale state, missing order, missing confirmation and permission failures never write", async () => {
  const stale = databaseFixture({ ...order, status: "ملغي" });
  await assert.rejects(stale.updateOrderStatus(order.id, "تم التحويل", true, order.status), /تغيرت حالة/);
  assert.equal(stale.writes.length, 0);
  const missing = databaseFixture(order, false);
  await assert.rejects(missing.updateOrderStatus(order.id, "ملغي"), /غير موجود/);
  assert.equal(missing.writes.length, 0);
  const unconfirmed = databaseFixture(order);
  await assert.rejects(unconfirmed.updateOrderStatus(order.id, "تم التحويل"), /أكد وصول/);
  assert.equal(unconfirmed.writes.length, 0);
  const denied = databaseFixture(order, true, true);
  await assert.rejects(denied.updateOrderStatus(order.id, "ملغي"), /permission-denied/);
  assert.equal(denied.writes.length, 0);
});

test("orders without a historical state can still be updated", async () => {
  const db = databaseFixture({ paymentStatus: "غير مدفوع" });
  await db.updateOrderStatus(order.id, "تم التحويل", true, "جديد");
  assert.equal(db.writes.length, 1);
});
