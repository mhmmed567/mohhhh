import { almService } from "@/lib/server/alm";
import {
  AlmError,
  almBody,
  almFailure,
  almJson,
  requireAlmAdmin,
  requireAlmEnabled,
} from "@/lib/server/alm-http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
type Context = { params: { token: string } };

export async function GET(request: Request, { params }: Context) {
  try {
    requireAlmEnabled();
    await requireAlmAdmin(request);
    return almJson(await almService().voucher(params.token));
  } catch (error) {
    return almFailure(error);
  }
}

export async function POST(request: Request, { params }: Context) {
  try {
    requireAlmEnabled();
    const admin = await requireAlmAdmin(request);
    if ((await almBody(request)).confirmed !== true)
      throw new AlmError(400, "أكد صرف الهدية أولًا.");
    return almJson(await almService().redeem(params.token, admin.uid));
  } catch (error) {
    return almFailure(error);
  }
}
