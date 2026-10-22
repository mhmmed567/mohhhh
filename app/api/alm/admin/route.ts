import { almService } from "@/lib/server/alm";
import {
  almBody,
  almFailure,
  almJson,
  requireAlmAdmin,
  requireAlmEnabled,
} from "@/lib/server/alm-http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    requireAlmEnabled();
    await requireAlmAdmin(request);
    const params = new URL(request.url).searchParams;
    return almJson(
      await almService().dashboard(params.get("cursor"), params.get("orderId")),
    );
  } catch (error) {
    return almFailure(error);
  }
}

export async function PUT(request: Request) {
  try {
    requireAlmEnabled();
    const admin = await requireAlmAdmin(request);
    return almJson({
      campaign: await almService().configure(await almBody(request), admin.uid),
    });
  } catch (error) {
    return almFailure(error);
  }
}
