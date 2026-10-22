const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const { randomBytes } = require("node:crypto");
const { initializeApp, deleteApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

let enabled = true;
let currentClaims = { uid: "test-admin", role: "admin" };
let serviceForRoutes;
const cache = new Map();
const verificationCalls = [];
const serverMock = {
  almEnabled: () => enabled,
  serverAuth: () => ({
    verifyIdToken: async (token, revoked) => {
      verificationCalls.push({ token, revoked });
      if (token === "invalid") throw new Error("invalid token");
      return currentClaims;
    },
  }),
};

function loadTs(relativeFile) {
  const filename = path.resolve(__dirname, "..", relativeFile);
  if (cache.has(filename)) return cache.get(filename);
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;
  const exports = {};
  cache.set(filename, exports);
  const requireTs = (name) => {
    if (name === "server-only") return {};
    if (name === "./firebase-admin" || name === "@/lib/server/firebase-admin")
      return serverMock;
    if (name === "@/lib/server/alm")
      return { almService: () => serviceForRoutes };
    if (name.startsWith("@/")) return loadTs(name.slice(2) + ".ts");
    if (name.startsWith("."))
      return loadTs(
        path.relative(
          path.resolve(__dirname, ".."),
          path.resolve(path.dirname(filename), name),
        ) + ".ts",
      );
    return require(name);
  };
  vm.runInThisContext("(function(exports, require) {\n" + source + "\n})", {
    filename,
  })(exports, requireTs);
  return exports;
}
const helpers = loadTs("lib/alm-rewards.ts");
const { AlmError, requireAlmAdmin } = loadTs("lib/server/alm-http.ts");
const { AlmService } = loadTs("lib/server/alm-service.ts");
const redeemRoute = loadTs("app/api/alm/admin/redeem/[token]/route.ts");
const allocationRoute = loadTs("app/api/alm/admin/allocate/route.ts");
const giftRoute = loadTs("app/api/alm/gift/[token]/route.ts");
const token = "a".repeat(64);
const request = (body, authorization = "Bearer valid") =>
  new Request("http://localhost/api/alm/admin/redeem/" + token, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      ...(authorization ? { Authorization: authorization } : {}),
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

test("return path preserves QR login and rejects open redirects", () => {
  assert.equal(
    helpers.safeAlmReturnPath("/admin/alm/redeem/" + token),
    "/admin/alm/redeem/" + token,
  );
  assert.equal(helpers.safeAlmReturnPath("/admin/alm"), "/admin/alm");
  for (const value of [
    null,
    "//evil.test",
    "https://evil.test/admin/alm",
    "/admin/alm?x=1",
    "/admin/alm/redeem/not-a-token",
    "/admin/alm/../settings",
  ]) {
    assert.equal(helpers.safeAlmReturnPath(value), null);
  }
});

test("gift tokens require 256-bit hex and messages use the customer card", () => {
  assert.equal(helpers.isAlmToken(token), true);
  for (const value of [
    "",
    "ALM-12345678",
    "../main",
    token + "a",
    "G".repeat(64),
    null,
  ])
    assert.equal(helpers.isAlmToken(value), false);
  const message = helpers.almGiftMessage(
    { token, rewardTitle: "مشروب ضيافة" },
    "https://hammar1.shop",
  );
  assert.match(message, /https:\/\/hammar1.shop\/alm\/gift\//);
  assert.doesNotMatch(message, /\/admin\//);
  assert.match(message, /مرة واحدة/);
});

test("unpaid, cancelled and returned orders are ineligible", () => {
  assert.equal(
    helpers.almOrderEligible({ status: "تم التحويل", paymentStatus: "مدفوع" }),
    true,
  );
  assert.equal(
    helpers.almOrderEligible({ status: "تم التسليم", paymentStatus: "مدفوع" }),
    true,
  );
  for (const status of ["ملغي", "cancelled", "مرتجع", "استرجاع الطلب"])
    assert.equal(
      helpers.almOrderEligible({ status, paymentStatus: "مدفوع" }),
      false,
    );
  assert.equal(
    helpers.almOrderEligible({
      status: "تم التحويل",
      paymentStatus: "غير مدفوع",
    }),
    false,
  );
});

test("API verifies token revocation and refuses anonymous, expired, customer and staff identities", async () => {
  await assert.rejects(() => requireAlmAdmin(request(undefined, "")), {
    status: 401,
  });
  await assert.rejects(
    () => requireAlmAdmin(request(undefined, "Bearer invalid")),
    { status: 401 },
  );
  for (const role of ["staff", "customer", undefined]) {
    currentClaims = { uid: "not-admin", role };
    await assert.rejects(() => requireAlmAdmin(request()), { status: 403 });
  }
  currentClaims = { uid: "test-admin", role: "admin" };
  assert.equal((await requireAlmAdmin(request())).uid, "test-admin");
  assert.equal(verificationCalls.at(-1).revoked, true);
});

test("redeem GET only inspects; mutations require admin and explicit confirmation", async () => {
  enabled = true;
  let mutations = 0;
  const voucher = {
    token,
    code: "ALM-AAAAAAAA",
    rewardTitle: "قهوة",
    status: "ready",
    customerName: "Private buyer",
    customerPhone: "96890000000",
    orderId: "private-order",
  };
  serviceForRoutes = {
    voucher: async () => ({ voucher, eligible: true }),
    redeem: async () => {
      mutations++;
      return { outcome: "redeemed", voucher };
    },
  };
  assert.equal(
    (await redeemRoute.GET(request(), { params: { token } })).status,
    200,
  );
  assert.equal(mutations, 0);
  assert.equal(
    (await redeemRoute.POST(request({}), { params: { token } })).status,
    400,
  );
  currentClaims = { uid: "staff", role: "staff" };
  assert.equal(
    (
      await redeemRoute.POST(request({ confirmed: true }), {
        params: { token },
      })
    ).status,
    403,
  );
  currentClaims = { uid: "test-admin", role: "admin" };
  assert.equal(
    (
      await redeemRoute.POST(request({ confirmed: true }, ""), {
        params: { token },
      })
    ).status,
    401,
  );
  assert.equal(mutations, 0);
  assert.equal(
    (
      await redeemRoute.POST(request({ confirmed: true }), {
        params: { token },
      })
    ).status,
    200,
  );
  assert.equal(mutations, 1);
});

test("public gift exposes QR without customer or order data; PNG download works", async () => {
  const response = await giftRoute.GET(
    new Request("http://localhost/api/alm/gift/" + token),
    { params: { token } },
  );
  const json = await response.json();
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.ok(json.qr.startsWith("data:image/png;base64,"));
  for (const field of [
    "customerName",
    "customerPhone",
    "orderId",
    "usedBy",
    "token",
  ])
    assert.equal(field in json, false);
  const image = await giftRoute.GET(
    new Request("http://localhost/api/alm/gift/" + token + "?download=1"),
    { params: { token } },
  );
  assert.equal(image.headers.get("content-type"), "image/png");
  const bytes = Buffer.from(await image.arrayBuffer());
  assert.equal(bytes.subarray(1, 4).toString(), "PNG");
});

test("disabled deployment keeps existing order messages working and makes no allocation", async () => {
  enabled = false;
  serviceForRoutes = {
    allocate: () => {
      throw new Error("must not be called");
    },
  };
  const response = await allocationRoute.POST(
    request({ orderId: "test", mode: "auto" }),
  );
  assert.equal(response.status, 200);
  assert.equal((await response.json()).reason, "disabled");
  enabled = true;
});

// Run against the real Firestore transaction implementation, never production.
// Start a local Firestore emulator, then FIRESTORE_EMULATOR_HOST=127.0.0.1:8085 npm run test:alm.
const emulator = process.env.FIRESTORE_EMULATOR_HOST;
test(
  "Firestore integration: quotas, concurrency, random decisions and single-use redemption",
  { skip: !emulator, timeout: 180000 },
  async (t) => {
    const app = initializeApp(
      { projectId: "demo-hammar-alm-tests" },
      "alm-tests-" + process.pid,
    );
    const rewards = getFirestore(app, "alm-rewards");
    const orders = getFirestore(app);
    let service;
    const config = {
      active: true,
      limit: 100,
      chancePercent: 100,
      rewardTitle: "مشروب ضيافة",
    };
    async function reset(changes = {}, draw = () => 0) {
      for (const collection of [
        "vouchers",
        "campaigns",
        "decisions",
        "customers",
      ])
        await rewards.recursiveDelete(rewards.collection(collection));
      await orders.recursiveDelete(orders.collection("orders"));
      service = new AlmService(rewards, orders, draw);
      await service.configure({ ...config, ...changes }, "test-admin");
    }
    async function seed(id, phone = "90000000", changes = {}) {
      await orders
        .doc("orders/" + id)
        .set({
          customer: { name: "Test buyer", phone },
          status: "تم التحويل",
          paymentStatus: "مدفوع",
          ...changes,
        });
    }
    try {
      await t.test(
        "manual and automatic repeats share one voucher and one capacity slot",
        async () => {
          await reset();
          await seed("repeat");
          const first = await service.allocate("repeat", "auto", "admin");
          const again = await service.allocate("repeat", "auto", "admin");
          const manual = await service.allocate("repeat", "manual", "admin");
          assert.equal(first.voucher.token.length, 64);
          assert.equal(first.voucher.token, again.voucher.token);
          assert.equal(first.voucher.token, manual.voucher.token);
          assert.equal((await service.dashboard()).campaign.issuedCount, 1);
        },
      );
      await t.test(
        "losing decision never rerolls but admin can explicitly override",
        async () => {
          await reset({ chancePercent: 0 });
          await seed("lost");
          assert.equal(
            (await service.allocate("lost", "auto", "admin")).reason,
            "not_selected",
          );
          await service.configure(config, "admin");
          assert.equal(
            (await service.allocate("lost", "auto", "admin")).reason,
            "not_selected",
          );
          assert.ok(
            (await service.allocate("lost", "manual", "admin")).voucher,
          );
        },
      );
      await t.test(
        "normalized phone prevents different orders awarding the same customer twice",
        async () => {
          await reset();
          await seed("one", "90000000");
          await seed("two", "+968 9000 0000");
          assert.ok((await service.allocate("one", "manual", "admin")).voucher);
          assert.equal(
            (await service.allocate("two", "manual", "admin")).reason,
            "duplicate_customer",
          );
        },
      );
      await t.test("concurrent allocation respects total cap", async () => {
        await reset({ limit: 2 });
        for (let i = 0; i < 5; i++) await seed("race-" + i, "9000000" + i);
        const result = await Promise.all(
          Array.from({ length: 5 }, (_, i) =>
            service.allocate("race-" + i, "auto", "admin"),
          ),
        );
        assert.equal(result.filter((item) => item.voucher).length, 2);
        assert.equal((await service.dashboard()).campaign.issuedCount, 2);
      });
      await t.test(
        "two scanners redeem exactly once; refresh never prepares another order",
        async () => {
          await reset();
          await seed("redeem");
          const { voucher } = await service.allocate(
            "redeem",
            "manual",
            "admin",
          );
          assert.equal(
            (await service.voucher(voucher.token)).voucher.status,
            "ready",
          );
          const result = await Promise.all([
            service.redeem(voucher.token, "admin-one"),
            service.redeem(voucher.token, "admin-two"),
          ]);
          assert.equal(
            result.filter((item) => item.outcome === "redeemed").length,
            1,
          );
          assert.equal(
            result.filter((item) => item.outcome === "already_used").length,
            1,
          );
          assert.equal(
            (await service.redeem(voucher.token, "admin-three")).outcome,
            "already_used",
          );
          const dashboard = await service.dashboard();
          assert.equal(dashboard.campaign.redeemedCount, 1);
          const stored = await rewards.doc("vouchers/" + voucher.token).get();
          assert.ok(["admin-one", "admin-two"].includes(stored.data().usedBy));
        },
      );
      await t.test(
        "cancellation or refund status prevents redemption and does not consume voucher",
        async () => {
          await reset();
          await seed("cancel");
          const { voucher } = await service.allocate(
            "cancel",
            "manual",
            "admin",
          );
          await orders.doc("orders/cancel").update({ status: "ملغي" });
          await assert.rejects(() => service.redeem(voucher.token, "admin"), {
            status: 409,
          });
          assert.equal(
            (await service.voucher(voucher.token)).voucher.status,
            "ready",
          );
        },
      );
      await t.test(
        "paused automation preserves manual grants, existing titles and allocated vouchers",
        async () => {
          await reset({ active: false });
          await seed("paused");
          await seed("other", "90000001");
          assert.equal(
            (await service.allocate("paused", "auto", "admin")).reason,
            "paused",
          );
          const first = await service.allocate("paused", "manual", "admin");
          await service.configure(
            { ...config, active: false, rewardTitle: "هدية جديدة" },
            "admin",
          );
          assert.equal(
            (await service.allocate("paused", "auto", "admin")).voucher.token,
            first.voucher.token,
          );
          assert.equal(
            (await service.voucher(first.voucher.token)).voucher.rewardTitle,
            "مشروب ضيافة",
          );
          assert.equal(
            (await service.allocate("other", "manual", "admin")).voucher
              .rewardTitle,
            "هدية جديدة",
          );
          await assert.rejects(
            () => service.configure({ ...config, limit: 1 }, "admin"),
            { status: 409 },
          );
        },
      );
      await t.test(
        "unpaid or missing orders and invalid configuration cannot allocate",
        async () => {
          await reset();
          await seed("unpaid", "90000000", { paymentStatus: "غير مدفوع" });
          assert.equal(
            (await service.allocate("unpaid", "manual", "admin")).reason,
            "unpaid",
          );
          await assert.rejects(
            () => service.allocate("missing", "manual", "admin"),
            { status: 404 },
          );
          await assert.rejects(() => service.voucher("not-a-token"), {
            status: 404,
          });
          for (const input of [
            { ...config, limit: -1 },
            { ...config, chancePercent: 101 },
            { ...config, active: "true" },
            { ...config, rewardTitle: "" },
          ]) {
            await assert.rejects(() => service.configure(input, "admin"), {
              status: 400,
            });
          }
          assert.equal((await service.dashboard()).campaign.issuedCount, 0);
        },
      );
      await t.test(
        "order lookup and pagination use stored tokens without duplicating rows",
        async () => {
          await reset();
          for (let i = 0; i < 3; i++) {
            await seed("lookup-" + i, "9000000" + i);
            await service.allocate("lookup-" + i, "manual", "admin");
          }
          const found = await service.dashboard(null, "lookup-1");
          assert.equal(found.vouchers.length, 1);
          assert.equal(found.vouchers[0].orderId, "lookup-1");
          const dashboard = await service.dashboard();
          const next = await service.dashboard(dashboard.vouchers[0].token);
          assert.equal(next.vouchers.length, 2);
          assert.equal(
            next.vouchers.some(
              (item) => item.token === dashboard.vouchers[0].token,
            ),
            false,
          );
        },
      );
    } finally {
      await rewards.terminate();
      await orders.terminate();
      await deleteApp(app);
    }
  },
);
