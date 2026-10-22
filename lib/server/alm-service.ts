import "server-only";
import { createHash, randomBytes, randomInt } from "node:crypto";
import {
  FieldPath,
  Timestamp,
  type Firestore,
  type DocumentData,
} from "firebase-admin/firestore";
import {
  defaultAlmCampaign,
  almOrderEligible,
  isAlmToken,
  type AlmCampaign,
  type AlmVoucher,
  type AlmAllocation,
} from "../alm-rewards";
import { normalizeOrderStatus } from "../order-workflow";
import { normalizeWhatsAppPhone } from "../whatsapp";
import { AlmError } from "./alm-http";

type RecordData = DocumentData;
const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const iso = (value: Timestamp | undefined) =>
  value?.toDate().toISOString() || null;

function voucherView(data: RecordData): AlmVoucher {
  return {
    token: data.token,
    code: data.code,
    orderId: data.orderId,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    rewardTitle: data.rewardTitle,
    status: data.usedAt ? "used" : "ready",
    issuedAt: iso(data.issuedAt) || "",
    usedAt: iso(data.usedAt),
  };
}

function campaignView(data?: RecordData): AlmCampaign {
  return { ...defaultAlmCampaign, ...data };
}

function orderId(value: unknown): string {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(value))
    throw new AlmError(400, "رقم الطلب غير صحيح.");
  return value;
}

export class AlmService {
  constructor(
    private rewards: Firestore,
    private orders: Firestore,
    private draw: () => number = () => randomInt(100),
    private makeToken: () => string = () => randomBytes(32).toString("hex"),
  ) {}

  async dashboard(cursor?: string | null, filterOrderId?: string | null) {
    const campaign = await this.rewards.doc("campaigns/main").get();
    let query = this.rewards
      .collection("vouchers")
      .orderBy("issuedAt", "desc")
      .orderBy(FieldPath.documentId(), "desc");
    if (cursor) {
      if (!isAlmToken(cursor)) throw new AlmError(400, "مؤشر الصفحة غير صحيح.");
      const after = await this.rewards.doc("vouchers/" + cursor).get();
      if (!after.exists) throw new AlmError(400, "تعذر تحميل الصفحة التالية.");
      query = query.startAfter(after);
    }
    if (filterOrderId) {
      const decision = await this.rewards
        .doc("decisions/" + hash(orderId(filterOrderId)))
        .get();
      const id = decision.data()?.voucherId;
      const voucher = id
        ? await this.rewards.doc("vouchers/" + id).get()
        : null;
      return {
        campaign: campaignView(campaign.data()),
        vouchers: voucher?.exists ? [voucherView(voucher.data()!)] : [],
        nextCursor: null,
      };
    }
    const snapshot = await query.limit(51).get();
    const rows = snapshot.docs.slice(0, 50);
    return {
      campaign: campaignView(campaign.data()),
      vouchers: rows.map((item) => voucherView(item.data())),
      nextCursor: snapshot.size > 50 ? rows[rows.length - 1].id : null,
    };
  }

  async configure(input: Record<string, unknown>, uid: string) {
    if (
      typeof input.active !== "boolean" ||
      !Number.isInteger(input.limit) ||
      Number(input.limit) < 1 ||
      Number(input.limit) > 10000 ||
      !Number.isInteger(input.chancePercent) ||
      Number(input.chancePercent) < 0 ||
      Number(input.chancePercent) > 100 ||
      typeof input.rewardTitle !== "string" ||
      !input.rewardTitle.trim() ||
      input.rewardTitle.trim().length > 100
    ) {
      throw new AlmError(
        400,
        "أدخل عددًا من 1 إلى 10000، ونسبة من 0 إلى 100، ووصفًا للهدية لا يتجاوز 100 حرف.",
      );
    }
    const active = input.active;
    const rewardTitle = input.rewardTitle.trim();
    return this.rewards.runTransaction(async (tx) => {
      const ref = this.rewards.doc("campaigns/main");
      const previous = campaignView((await tx.get(ref)).data());
      if (Number(input.limit) < previous.issuedCount)
        throw new AlmError(409, "العدد أقل من الهدايا الممنوحة بالفعل.");
      const campaign: AlmCampaign = {
        active,
        limit: Number(input.limit),
        chancePercent: Number(input.chancePercent),
        rewardTitle,
        issuedCount: previous.issuedCount,
        redeemedCount: previous.redeemedCount,
      };
      tx.set(ref, { ...campaign, updatedAt: Timestamp.now(), updatedBy: uid });
      return campaign;
    });
  }

  async allocate(
    rawOrderId: unknown,
    mode: "auto" | "manual",
    uid: string,
  ): Promise<AlmAllocation> {
    const id = orderId(rawOrderId);
    const order = await this.orders.doc("orders/" + id).get();
    if (!order.exists) throw new AlmError(404, "الطلب غير موجود.");
    const data = order.data()!;
    if (["ملغي", "استرجاع الطلب"].includes(normalizeOrderStatus(data.status)))
      return { voucher: null, reason: "closed" };
    if (!almOrderEligible(data)) return { voucher: null, reason: "unpaid" };
    const phone = normalizeWhatsAppPhone(data.customer?.phone || data.phone);
    if (!phone)
      throw new AlmError(400, "أضف رقم هاتف صحيحًا للعميل قبل منح الهدية.");
    const token = this.makeToken();
    const draw = this.draw(); // Stable across transaction retries.
    const issuedAt = Timestamp.now();
    return this.rewards.runTransaction(async (tx) => {
      const configRef = this.rewards.doc("campaigns/main");
      const decisionRef = this.rewards.doc("decisions/" + hash(id));
      const customerRef = this.rewards.doc("customers/" + hash(phone));
      const [config, decision, customer] = await Promise.all([
        tx.get(configRef),
        tx.get(decisionRef),
        tx.get(customerRef),
      ]);
      const campaign = campaignView(config.data());
      const previousVoucher = decision.data()?.voucherId;
      if (previousVoucher) {
        const existing = await tx.get(
          this.rewards.doc("vouchers/" + previousVoucher),
        );
        if (!existing.exists)
          throw new AlmError(409, "تعذر العثور على الهدية المسجلة لهذا الطلب.");
        return { voucher: voucherView(existing.data()!) };
      }
      if (customer.exists)
        return { voucher: null, reason: "duplicate_customer" };
      if (mode === "auto" && !campaign.active)
        return { voucher: null, reason: "paused" };
      if (campaign.issuedCount >= campaign.limit)
        return { voucher: null, reason: "limit_reached" };
      if (
        mode === "auto" &&
        (decision.exists || draw >= campaign.chancePercent)
      ) {
        if (!decision.exists)
          tx.create(decisionRef, { selected: false, evaluatedAt: issuedAt });
        return { voucher: null, reason: "not_selected" };
      }
      const voucher = {
        token,
        code: "ALM-" + token.slice(0, 8).toUpperCase(),
        orderId: id,
        customerName: String(
          data.customer?.name || data.customerName || data.name || "عميل همّار",
        ),
        customerPhone: phone,
        rewardTitle: campaign.rewardTitle,
        issuedAt,
        usedAt: null,
        usedBy: null,
        grantedBy: uid,
        selection: mode,
      };
      tx.create(this.rewards.doc("vouchers/" + token), voucher);
      tx.set(decisionRef, {
        selected: true,
        voucherId: token,
        evaluatedAt: issuedAt,
      });
      tx.create(customerRef, { voucherId: token, createdAt: issuedAt });
      tx.set(
        configRef,
        { ...campaign, issuedCount: campaign.issuedCount + 1 },
        { merge: true },
      );
      return { voucher: voucherView(voucher) };
    });
  }

  async voucher(token: string) {
    if (!isAlmToken(token))
      throw new AlmError(404, "رمز الهدية غير صحيح أو غير موجود.");
    const snapshot = await this.rewards.doc("vouchers/" + token).get();
    if (!snapshot.exists)
      throw new AlmError(404, "رمز الهدية غير صحيح أو غير موجود.");
    const voucher = voucherView(snapshot.data()!);
    const order = await this.orders.doc("orders/" + voucher.orderId).get();
    const eligible = order.exists && almOrderEligible(order.data()!);
    return { voucher, eligible };
  }

  async redeem(token: string, uid: string) {
    const checked = await this.voucher(token);
    if (!checked.eligible)
      throw new AlmError(
        409,
        "لا يمكن صرف الهدية: الطلب غير مدفوع أو ملغي أو مسترجع.",
      );
    return this.rewards.runTransaction(async (tx) => {
      const ref = this.rewards.doc("vouchers/" + token);
      const campaignRef = this.rewards.doc("campaigns/main");
      const [snapshot, config] = await Promise.all([
        tx.get(ref),
        tx.get(campaignRef),
      ]);
      if (!snapshot.exists) throw new AlmError(404, "الهدية غير موجودة.");
      const data = snapshot.data()!;
      if (data.usedAt)
        return { outcome: "already_used" as const, voucher: voucherView(data) };
      const usedAt = Timestamp.now();
      tx.update(ref, { usedAt, usedBy: uid });
      const campaign = campaignView(config.data());
      tx.set(
        campaignRef,
        { ...campaign, redeemedCount: campaign.redeemedCount + 1 },
        { merge: true },
      );
      return {
        outcome: "redeemed" as const,
        voucher: voucherView({ ...data, usedAt }),
      };
    });
  }
}
