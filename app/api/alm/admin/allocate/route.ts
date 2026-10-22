import { almService } from "@/lib/server/alm";
import { almEnabled } from "@/lib/server/firebase-admin";
import {
  AlmError,
  almBody,
  almFailure,
  almJson,
  requireAlmAdmin,
} from "@/lib/server/alm-http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!almEnabled()) return almJson({ voucher: null, reason: "disabled" });
    const admin = await requireAlmAdmin(request);
    const body = await almBody(request);
    if (body.mode !== "auto" && body.mode !== "manual")
      throw new AlmError(400, "طريقة الاختيار غير صحيحة.");
    return almJson(
      await almService().allocate(body.orderId, body.mode, admin.uid),
    );
  } catch (error) {
    return almFailure(error);
  }
}
